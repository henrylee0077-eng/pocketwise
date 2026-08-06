// App-lock PIN + account reset + preferred currency — replaces the
// set_pin/verify_pin/clear_pin/reset_my_account/set_preferred_currency
// Postgres functions (see supabase/migrations/0004_pin_and_reset.sql and
// 0006_preferred_currency_rpc.sql). Same lockout policy (5 attempts, 5
// minute lockout), same PIN format (6 digits) — just hashed on-device with
// Web Crypto's PBKDF2 instead of Postgres's pgcrypto/bcrypt, since there's
// no server to run the comparison anymore.
import { db, nowIso } from "@/lib/local-db/schema";
import type { LocalSettings } from "@/lib/local-db/schema";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;
const PBKDF2_ITERATIONS = 150_000;

export interface VerifyPinResult {
  ok: boolean;
  reason?: "not_set" | "locked" | "incorrect";
  attemptsRemaining?: number;
  lockedUntil?: string;
}

function toBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function randomSaltBase64(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return toBase64(salt.buffer);
}

async function derivePinHash(pin: string, saltBase64: string): Promise<string> {
  const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return toBase64(derived);
}

async function getSettingsOrThrow(): Promise<LocalSettings> {
  const settings = await db.settings.get("singleton");
  if (!settings) throw new Error("Local settings not initialized");
  return settings;
}

export async function fetchSettings(): Promise<LocalSettings> {
  return getSettingsOrThrow();
}

export async function setPin(pin: string): Promise<void> {
  if (!/^[0-9]{6}$/.test(pin)) {
    throw new Error("PIN must be exactly 6 digits");
  }

  const salt = randomSaltBase64();
  const hash = await derivePinHash(pin, salt);

  await db.settings.update("singleton", {
    pinHash: hash,
    pinSalt: salt,
    pinEnabled: true,
    pinFailedAttempts: 0,
    pinLockedUntil: null,
    updatedAt: nowIso(),
  });
}

export async function verifyPin(candidate: string): Promise<VerifyPinResult> {
  const settings = await getSettingsOrThrow();

  if (!settings.pinHash || !settings.pinSalt) {
    return { ok: false, reason: "not_set" };
  }

  if (settings.pinLockedUntil && new Date(settings.pinLockedUntil) > new Date()) {
    return { ok: false, reason: "locked", lockedUntil: settings.pinLockedUntil };
  }

  const candidateHash = await derivePinHash(candidate, settings.pinSalt);

  if (candidateHash === settings.pinHash) {
    await db.settings.update("singleton", {
      pinFailedAttempts: 0,
      pinLockedUntil: null,
      updatedAt: nowIso(),
    });
    return { ok: true };
  }

  const newAttempts = settings.pinFailedAttempts + 1;
  let lockedUntil: string | null = null;
  let attemptsAfter = newAttempts;

  if (newAttempts >= MAX_ATTEMPTS) {
    lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString();
    attemptsAfter = 0;
  }

  await db.settings.update("singleton", {
    pinFailedAttempts: attemptsAfter,
    pinLockedUntil: lockedUntil,
    updatedAt: nowIso(),
  });

  return {
    ok: false,
    reason: "incorrect",
    attemptsRemaining: Math.max(MAX_ATTEMPTS - attemptsAfter, 0),
    lockedUntil: lockedUntil ?? undefined,
  };
}

export async function clearPin(): Promise<void> {
  await db.settings.update("singleton", {
    pinHash: null,
    pinSalt: null,
    pinEnabled: false,
    pinFailedAttempts: 0,
    pinLockedUntil: null,
    updatedAt: nowIso(),
  });
}

/** Deletes all financial data on this device and clears the PIN. Mirrors
 * `reset_my_account()` — irreversible, and (unlike that RPC) also has
 * nothing server-side to leave behind: once this resolves, the device has
 * no PocketWise data left except system defaults, which get reseeded. */
export async function resetAccount(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.transactions,
      db.recurringTransactions,
      db.categoryBudgets,
      db.budgets,
      db.tags,
      db.accounts,
      db.categories,
      db.paymentMethods,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.recurringTransactions.clear(),
        db.categoryBudgets.clear(),
        db.budgets.clear(),
        db.tags.clear(),
        db.accounts.clear(),
        db.categories.clear(),
        db.paymentMethods.clear(),
      ]);

      await db.settings.update("singleton", {
        pinHash: null,
        pinSalt: null,
        pinEnabled: false,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
        updatedAt: nowIso(),
      });
    },
  );

  const { ensureSeeded } = await import("@/lib/local-db/seed");
  await ensureSeeded();
}

/**
 * Atomically sets the device's preferred currency and re-labels every
 * existing account to match — mirrors the old `set_preferred_currency`
 * Postgres RPC. PocketWise is single-currency, not a multi-currency ledger
 * with FX rates, so there's no such thing as "this one account stays in
 * the old currency" without also wiring up conversion, which stays out of
 * scope here.
 */
export async function setPreferredCurrency(currencyCode: string): Promise<void> {
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    throw new Error("Currency must be a 3-letter ISO 4217 code");
  }

  await db.transaction("rw", db.settings, db.accounts, async () => {
    const timestamp = nowIso();
    await db.settings.update("singleton", {
      preferredCurrency: currencyCode,
      updatedAt: timestamp,
    });

    const accounts = await db.accounts.toArray();
    await Promise.all(
      accounts.map((account) =>
        db.accounts.update(account.id, { currency: currencyCode, updated_at: timestamp }),
      ),
    );
  });
}

export async function setPreferredLanguage(language: "en" | "zh"): Promise<void> {
  await db.settings.update("singleton", {
    preferredLanguage: language,
    updatedAt: nowIso(),
  });
}
