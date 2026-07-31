"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useProfile } from "@/hooks/use-security";
import { PinDialog } from "@/components/security/PinDialog";

type DialogMode = "set" | "change" | "remove" | null;

export function AppLockSection() {
  const { t } = useLanguage();
  const { data: profile } = useProfile();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  const pinEnabled = profile?.pin_enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.appLock.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="pin-lock-toggle">{t("security.appLock.toggleLabel")}</Label>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("security.appLock.description")}</p>
          </div>
          <Switch
            id="pin-lock-toggle"
            checked={pinEnabled}
            onCheckedChange={(checked) => setDialogMode(checked ? "set" : "remove")}
          />
        </div>

        {pinEnabled && (
          <Button type="button" variant="outline" className="w-fit" onClick={() => setDialogMode("change")}>
            {t("security.appLock.changePin")}
          </Button>
        )}
      </CardContent>

      {dialogMode && (
        <PinDialog
          open={!!dialogMode}
          onOpenChange={(open) => !open && setDialogMode(null)}
          mode={dialogMode}
          onSuccess={() => setDialogMode(null)}
        />
      )}
    </Card>
  );
}
