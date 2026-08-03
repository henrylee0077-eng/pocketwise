"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Wallet, Settings, PiggyBank, Plus, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import type { ReactNode } from "react";

function useNavItems() {
  const { t } = useLanguage();
  return [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/transactions", label: t("nav.expenses"), icon: Receipt },
    { href: "/projects", label: t("nav.projects"), icon: Target },
    { href: "/budget", label: t("nav.budget"), icon: Wallet },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navItems = useNavItems();
  const { t } = useLanguage();

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PiggyBank className="size-5" />
          </span>
          <span className="text-base font-semibold tracking-tight">{t("app.nameLocal")}</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/transactions/new"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          {t("nav.addExpense")}
        </Link>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur md:left-60 md:pl-6">
        <Link
          href="/dashboard"
          className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:hidden"
          aria-label={t("app.nameLocal")}
        >
          <PiggyBank className="size-4" />
        </Link>

        <div className="flex flex-1 justify-center">
          <Link
            href="/ask-ai"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/70 px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/25 transition-opacity hover:opacity-90 active:opacity-80"
          >
            <Sparkles className="size-3.5" />
            {t("nav.askAi")}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="md:pl-60">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {navItems.slice(0, 2).map((item) => (
          <NavTab key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}

        <Link
          href="/transactions/new"
          className="flex -translate-y-3 items-center justify-center rounded-full bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
          aria-label={t("nav.addExpense")}
        >
          <Plus className="size-6" />
        </Link>

        {navItems.slice(2, 5).map((item) => (
          <NavTab key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </nav>
    </div>
  );
}

function NavTab({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof LayoutDashboard };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {item.label}
    </Link>
  );
}
