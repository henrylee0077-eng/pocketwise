"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountIcon } from "@/components/accounts/AccountIconPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn, toAccountTypeKey } from "@/lib/utils";
import { useFormatCurrency } from "@/hooks/use-currency";
import { LIABILITY_ACCOUNT_TYPES, type AccountBalance } from "@/types";

const VISIBLE_COUNT = 4;

export function AccountsOverviewCard({ accounts }: { accounts: AccountBalance[] }) {
  const { t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const active = accounts.filter((a) => !a.is_archived);

  if (active.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("dashboard.noAccountsYet")}</p>
        <Button asChild size="sm">
          <Link href="/settings/accounts">{t("dashboard.addAccountCta")}</Link>
        </Button>
      </div>
    );
  }

  const visible = active.slice(0, VISIBLE_COUNT);
  const remaining = active.length - visible.length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t("dashboard.accounts")}</CardTitle>
        <Link
          href="/settings/accounts"
          className="flex items-center gap-0.5 text-sm font-medium text-primary"
        >
          {t("dashboard.viewAll")}
          <ChevronRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-0">
        {visible.map((account) => {
          const isLiability = LIABILITY_ACCOUNT_TYPES.includes(account.type);
          const balance = Number(account.current_balance);

          return (
            <Link
              key={account.id}
              href={`/settings/accounts/${account.id}`}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${account.color}22`, color: account.color }}
              >
                <AccountIcon name={account.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{account.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {account.institution ?? t(`accounts.type${toAccountTypeKey(account.type)}`)}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold",
                  isLiability && balance < 0 ? "text-destructive" : "text-foreground",
                )}
              >
                {isLiability && balance < 0 ? `-${formatCurrency(Math.abs(balance))}` : formatCurrency(balance)}
              </span>
            </Link>
          );
        })}

        {remaining > 0 && (
          <Link
            href="/settings/accounts"
            className="px-5 py-3 text-center text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.viewAll")} +{remaining}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
