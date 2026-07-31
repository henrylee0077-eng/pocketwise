"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/security/PinInput";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useProfile, useResetAccount, useVerifyPin } from "@/hooks/use-security";

const CONFIRM_WORD = "reset";

type Step = "confirm" | "pin";

export function ResetAccountSection() {
  const { t } = useLanguage();
  const { data: profile } = useProfile();
  const resetAccount = useResetAccount();
  const verifyPin = useVerifyPin();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("confirm");
  const [confirmText, setConfirmText] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pinEnabled = profile?.pin_enabled ?? false;
  const textMatches = confirmText.trim().toLowerCase() === CONFIRM_WORD;
  const isBusy = resetAccount.isPending || verifyPin.isPending;

  function handleOpenChange(next: boolean) {
    if (isBusy) return;
    setOpen(next);
    if (!next) {
      setStep("confirm");
      setConfirmText("");
      setPin("");
      setError(null);
    }
  }

  async function executeReset() {
    setError(null);
    try {
      await resetAccount.mutateAsync();
      window.location.href = "/dashboard";
    } catch {
      setError(t("common.error"));
    }
  }

  function handleContinue() {
    if (!textMatches) return;
    if (pinEnabled) {
      setStep("pin");
    } else {
      void executeReset();
    }
  }

  async function handlePinComplete(candidate: string) {
    setError(null);
    try {
      const result = await verifyPin.mutateAsync(candidate);
      if (result.ok) {
        await executeReset();
        return;
      }
      setPin("");
      if (result.reason === "locked" && result.lockedUntil) {
        const minutes = Math.max(1, Math.ceil((new Date(result.lockedUntil).getTime() - Date.now()) / 60000));
        setError(t("security.pinDialog.locked", { minutes }));
      } else {
        setError(t("security.pinDialog.incorrect", { count: result.attemptsRemaining ?? 0 }));
      }
    } catch {
      setPin("");
      setError(t("common.error"));
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">{t("security.reset.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t("security.reset.description")}</p>
        <Button type="button" variant="destructive" className="w-fit" onClick={() => setOpen(true)}>
          {t("security.reset.button")}
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("security.reset.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("security.reset.dialogWarning")}</DialogDescription>
          </DialogHeader>

          {step === "confirm" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-confirm">{t("security.reset.typeToConfirm")}</Label>
              <Input
                id="reset-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                autoComplete="off"
                disabled={isBusy}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-muted-foreground">{t("security.reset.confirmPin")}</p>
              <PinInput
                value={pin}
                onChange={setPin}
                onComplete={handlePinComplete}
                autoFocus
                disabled={isBusy}
                invalid={!!error}
                aria-label={t("security.reset.confirmPin")}
              />
            </div>
          )}

          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {isBusy && (
            <div className="flex justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isBusy}>
              {t("security.pinDialog.cancel")}
            </Button>
            {step === "confirm" && (
              <Button type="button" variant="destructive" disabled={!textMatches || isBusy} onClick={handleContinue}>
                {t("security.reset.confirmButton")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
