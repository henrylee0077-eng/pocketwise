// Pure export/import of the entire local database to/from one JSON-
// serializable object. Used by the Google Drive backup flow (see
// src/lib/google-drive/backup.ts), and could equally back a "Export to
// file" / "Import from file" fallback later for anyone who doesn't want to
// sign in with Google at all.
import { db, nowIso } from "@/lib/local-db/schema";
import type { LocalSettings, LocalTransaction } from "@/lib/local-db/schema";
import type {
  Account,
  Budget,
  Category,
  CategoryBudget,
  PaymentMethod,
  Project,
  RecurringTransaction,
  Tag,
} from "@/types";

export const BACKUP_SCHEMA_VERSION = 1;

/** Settings fields that intentionally never leave the device — the PIN is a
 * device-local convenience lock, not an account credential, so restoring a
 * backup should never silently import a lock the new device's owner can't
 * necessarily open (e.g. a lost-phone scenario is exactly when you'd be
 * restoring onto a *new* phone in the first place). */
type BackedUpSettings = Omit<
  LocalSettings,
  "pinEnabled" | "pinHash" | "pinSalt" | "pinFailedAttempts" | "pinLockedUntil"
>;

export interface BackupPayload {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  data: {
    categories: Category[];
    paymentMethods: PaymentMethod[];
    tags: Tag[];
    accounts: Account[];
    transactions: LocalTransaction[];
    projects: Project[];
    budgets: Budget[];
    categoryBudgets: CategoryBudget[];
    recurringTransactions: RecurringTransaction[];
    settings: BackedUpSettings;
  };
}

export async function exportAllData(): Promise<BackupPayload> {
  const [
    categories,
    paymentMethods,
    tags,
    accounts,
    transactions,
    projects,
    budgets,
    categoryBudgets,
    recurringTransactions,
    settings,
  ] = await Promise.all([
    db.categories.toArray(),
    db.paymentMethods.toArray(),
    db.tags.toArray(),
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.projects.toArray(),
    db.budgets.toArray(),
    db.categoryBudgets.toArray(),
    db.recurringTransactions.toArray(),
    db.settings.get("singleton"),
  ]);

  if (!settings) throw new Error("Local settings not initialized");

  const {
    pinEnabled: _pinEnabled,
    pinHash: _pinHash,
    pinSalt: _pinSalt,
    pinFailedAttempts: _pinFailedAttempts,
    pinLockedUntil: _pinLockedUntil,
    ...settingsWithoutPin
  } = settings;

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: nowIso(),
    data: {
      categories,
      paymentMethods,
      tags,
      accounts,
      transactions,
      projects,
      budgets,
      categoryBudgets,
      recurringTransactions,
      settings: settingsWithoutPin,
    },
  };
}

/**
 * Wipes every local table and repopulates from a backup payload. The PIN
 * lock (if any was set on this device before restoring) is deliberately
 * preserved rather than cleared or overwritten — see the note on
 * `BackedUpSettings` above.
 */
export async function importAllData(payload: BackupPayload): Promise<void> {
  if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`Unsupported backup schema version: ${payload.schemaVersion}`);
  }

  await db.transaction(
    "rw",
    [
      db.categories,
      db.paymentMethods,
      db.tags,
      db.accounts,
      db.transactions,
      db.projects,
      db.budgets,
      db.categoryBudgets,
      db.recurringTransactions,
      db.settings,
    ],
    async () => {
      const existingSettings = await db.settings.get("singleton");

      await Promise.all([
        db.categories.clear(),
        db.paymentMethods.clear(),
        db.tags.clear(),
        db.accounts.clear(),
        db.transactions.clear(),
        db.projects.clear(),
        db.budgets.clear(),
        db.categoryBudgets.clear(),
        db.recurringTransactions.clear(),
      ]);

      const { data } = payload;
      await Promise.all([
        db.categories.bulkAdd(data.categories),
        db.paymentMethods.bulkAdd(data.paymentMethods),
        db.tags.bulkAdd(data.tags),
        db.accounts.bulkAdd(data.accounts),
        db.transactions.bulkAdd(data.transactions),
        db.projects.bulkAdd(data.projects),
        db.budgets.bulkAdd(data.budgets),
        db.categoryBudgets.bulkAdd(data.categoryBudgets),
        db.recurringTransactions.bulkAdd(data.recurringTransactions),
      ]);

      await db.settings.put({
        ...data.settings,
        pinEnabled: existingSettings?.pinEnabled ?? false,
        pinHash: existingSettings?.pinHash ?? null,
        pinSalt: existingSettings?.pinSalt ?? null,
        pinFailedAttempts: existingSettings?.pinFailedAttempts ?? 0,
        pinLockedUntil: existingSettings?.pinLockedUntil ?? null,
        lastRestoreAt: nowIso(),
      });
    },
  );
}
