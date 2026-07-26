"use client";

import { LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  async function handleSignOut() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.theme")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <Button variant="outline" onClick={handleSignOut} className="w-fit">
            <LogOut className="size-4" />
            {t("settings.signOut")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
