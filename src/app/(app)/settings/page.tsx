"use client";

import Link from "next/link";
import { BarChart3, ChevronRight, LogOut, Repeat, Tag, Tags, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AppLockSection } from "@/components/settings/AppLockSection";
import { CurrencySection } from "@/components/settings/CurrencySection";
import { ResetAccountSection } from "@/components/settings/ResetAccountSection";
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
          <CardTitle>{t("settings.manage")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 p-0">
          <Link
            href="/reports"
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <BarChart3 className="size-4 text-muted-foreground" />
            <span className="flex-1">{t("nav.reports")}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/categories"
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Tags className="size-4 text-muted-foreground" />
            <span className="flex-1">{t("categories.title")}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/tags"
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Tag className="size-4 text-muted-foreground" />
            <span className="flex-1">{t("transactions.tags")}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/accounts"
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Wallet className="size-4 text-muted-foreground" />
            <span className="flex-1">{t("accounts.title")}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/recurring"
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Repeat className="size-4 text-muted-foreground" />
            <span className="flex-1">{t("recurring.title")}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

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

      <CurrencySection />

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

      <AppLockSection />

      <ResetAccountSection />
    </div>
  );
}
