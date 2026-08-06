"use client";

import { useState, type ReactNode } from "react";
import { Loader2, PiggyBank } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/security/PinInput";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePinLock, useResetAccount, useVerifyPin } from "@/hooks/use-security";

const RESET_CONFIRM_WORD = "reset";

function ForgotPinDialog({ onReset }: { onReset: () => void }) {
  const { t } = useLanguage();
  const resetAccount = useResetAccount();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const textMatches = confirmText.trim().toLowerCase() === RESET_CONFIRM_WORD;

  function handleOpenChange(next: boolean) {
    if (resetAccount.isPending) return;
    setOpen(next);
    if (!next) {
      setConfirmText("");
      setError(null);
    }
  }

  async function handleConfirm() {
    if (!textMatches) return;
    setError(null);
    try {
      await resetAccount.mutateAsync();
      onReset();
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {t("security.lock.forgot")}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("security.lock.resetDialogTitle")}</DialogTitle>
            <DialogDescription>{t("security.lock.resetDialogWarning")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lock-reset-confirm">{t("security.lock.resetTypeToConfirm")}</Label>
            <Input
              id="lock-reset-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              autoComplete="off"
              disabled={resetAccount.isPending}
            />
          </div>

          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {resetAccount.isPending && (
            <div className="flex justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={resetAccount.isPending}
            >
              {t("security.pinDialog.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!textMatches || resetAccount.isPending}
              onClick={handleConfirm}
            >
              {t("security.lock.resetConfirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

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

      <ForgotPinDialog onReset={onUnlock} />
    </div>
  );
}

/**
 * Gates the entire app behind a PIN lock screen when one is set. There's
 * no server session underneath anymore — every device has exactly one
 * local user — so the only two states are "PIN set and locked" and
 * "unlocked/no PIN". Renders a lightweight loading state while we read the
 * lock status out of local settings, so content never flashes before the
 * gate decides.
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
