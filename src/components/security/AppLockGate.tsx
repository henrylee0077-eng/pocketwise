"use client";

import { useState, type ReactNode } from "react";
import { Loader2, PiggyBank } from "lucide-react";
import { PinInput } from "@/components/security/PinInput";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePinLock, useVerifyPin } from "@/hooks/use-security";

function PinLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useLanguage();
  const verifyPin = useVerifyPin();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(candidate: string) {
    setError(null);
    try {
      const result = await verifyPin.mutateAsync(candidate);
      if (result.ok) {
        onUnlock();
        return;
      }

      setPin("");
      if (result.reason === "locked" && result.lockedUntil) {
        const minutes = Math.max(1, Math.ceil((new Date(result.lockedUntil).getTime() - Date.now()) / 60000));
        setError(t("security.lock.locked", { minutes }));
      } else {
        setError(t("security.lock.incorrect", { count: result.attemptsRemaining ?? 0 }));
      }
    } catch {
      setPin("");
      setError(t("common.error"));
    }
  }

  async function handleSignOut() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 py-12">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <PiggyBank className="size-9" aria-hidden="true" />
      </div>

      <div className="text-center">
        <h1 className="text-lg font-semibold text-foreground">{t("security.lock.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("security.lock.subtitle")}</p>
      </div>

      <PinInput
        value={pin}
        onChange={setPin}
        onComplete={handleComplete}
        autoFocus
        disabled={verifyPin.isPending}
        invalid={!!error}
        aria-label={t("security.lock.title")}
      />

      <div className="flex h-5 items-center justify-center">
        {verifyPin.isPending ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {t("security.lock.forgot")}
      </button>
    </div>
  );
}

/**
 * Gates the entire app behind a PIN lock screen when one is set, layered on
 * top of the real Supabase session (see supabase/migrations/0004 for why
 * the PIN is only ever a quick-unlock convenience, never a standalone
 * credential). Renders a lightweight loading state while we determine lock
 * status, so authenticated content never flashes before the gate decides.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
  const { locked, ready, markUnlocked } = usePinLock();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (locked) {
    return <PinLockScreen onUnlock={markUnlocked} />;
  }

  return <>{children}</>;
}
