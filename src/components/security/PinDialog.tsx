"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/security/PinInput";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useClearPin, useSetPin, useVerifyPin } from "@/hooks/use-security";

type Mode = "set" | "change" | "remove";
type Step = "current" | "new" | "confirm";

function stepsFor(mode: Mode): Step[] {
  if (mode === "set") return ["new", "confirm"];
  if (mode === "remove") return ["current"];
  return ["current", "new", "confirm"];
}

function isWeakPin(pin: string): boolean {
  if (/^(\d)\1{5}$/.test(pin)) return true; // all six digits identical
  const ascending = "0123456789";
  const descending = "9876543210";
  return ascending.includes(pin) || descending.includes(pin);
}

export function PinDialog({
  open,
  onOpenChange,
  mode,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  onSuccess?: () => void;
}) {
  const { t } = useLanguage();
  const verifyPin = useVerifyPin();
  const setPin = useSetPin();
  const clearPin = useClearPin();

  const steps = stepsFor(mode);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const step = steps[stepIndex];
  const isSubmitting = verifyPin.isPending || setPin.isPending || clearPin.isPending;

  async function handleCurrentComplete(pin: string) {
    setError(null);
    try {
      const result = await verifyPin.mutateAsync(pin);
      if (!result.ok) {
        setCurrentPin("");
        if (result.reason === "locked" && result.lockedUntil) {
          const minutes = Math.max(1, Math.ceil((new Date(result.lockedUntil).getTime() - Date.now()) / 60000));
          setError(t("security.pinDialog.locked", { minutes }));
        } else {
          setError(t("security.pinDialog.incorrect", { count: result.attemptsRemaining ?? 0 }));
        }
        return;
      }

      if (mode === "remove") {
        await clearPin.mutateAsync();
        toast.success(t("security.pinDialog.removeSuccess"));
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      setStepIndex((i) => i + 1);
    } catch {
      setCurrentPin("");
      setError(t("common.error"));
    }
  }

  function handleNewComplete(pin: string) {
    setError(null);
    if (isWeakPin(pin)) {
      setNewPin("");
      setError(t("security.pinDialog.weakPin"));
      return;
    }
    setStepIndex((i) => i + 1);
  }

  async function handleConfirmComplete(pin: string) {
    setError(null);
    if (pin !== newPin) {
      setError(t("security.pinDialog.mismatch"));
      setNewPin("");
      setConfirmPin("");
      setStepIndex((i) => i - 1);
      return;
    }

    try {
      await setPin.mutateAsync(newPin);
      toast.success(t("security.pinDialog.setSuccess"));
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setConfirmPin("");
      setError(t("common.error"));
    }
  }

  const title =
    mode === "set"
      ? t("security.pinDialog.setTitle")
      : mode === "change"
        ? t("security.pinDialog.changeTitle")
        : t("security.pinDialog.removeTitle");

  const description =
    step === "current"
      ? t("security.pinDialog.enterCurrent")
      : step === "new"
        ? t("security.pinDialog.enterNew")
        : t("security.pinDialog.confirmNew");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-muted-foreground">{description}</p>

          {step === "current" && (
            <PinInput
              key="current"
              value={currentPin}
              onChange={setCurrentPin}
              onComplete={handleCurrentComplete}
              autoFocus
              disabled={isSubmitting}
              invalid={!!error}
              aria-label={t("security.pinDialog.enterCurrent")}
            />
          )}
          {step === "new" && (
            <PinInput
              key="new"
              value={newPin}
              onChange={setNewPin}
              onComplete={handleNewComplete}
              autoFocus
              disabled={isSubmitting}
              invalid={!!error}
              aria-label={t("security.pinDialog.enterNew")}
            />
          )}
          {step === "confirm" && (
            <PinInput
              key="confirm"
              value={confirmPin}
              onChange={setConfirmPin}
              onComplete={handleConfirmComplete}
              autoFocus
              disabled={isSubmitting}
              invalid={!!error}
              aria-label={t("security.pinDialog.confirmNew")}
            />
          )}

          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("security.pinDialog.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
