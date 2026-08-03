"use client";

import { useLanguage } from "@/i18n/LanguageProvider";
import { useFormatCurrency } from "@/hooks/use-currency";
import { ASSET_ACCOUNT_TYPES, type AccountBalance } from "@/types";

export function computeNetWorth(accounts: AccountBalance[]) {
  const active = accounts.filter((a) => !a.is_archived);
  const totalAssets = active
    .filter((a) => ASSET_ACCOUNT_TYPES.includes(a.type))
    .reduce((sum, a) => sum + Number(a.current_balance), 0);
  const totalLiabilities = active
    .filter((a) => !ASSET_ACCOUNT_TYPES.includes(a.type))
    .reduce((sum, a) => sum + Math.abs(Math.min(0, Number(a.current_balance))), 0);
  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
}

export function NetWorthSummary({ accounts }: { accounts: AccountBalance[] }) {
  const { t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const { totalAssets, totalLiabilities, netWorth } = computeNetWorth(accounts);

  if (accounts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{t("accounts.netWorth")}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{formatCurrency(netWorth)}</p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t("accounts.totalAssets")} <span className="font-medium text-foreground">{formatCurrency(totalAssets)}</span>
        </span>
        <span className="text-muted-foreground">
          {t("accounts.totalLiabilities")}{" "}
          <span className="font-medium text-destructive">{formatCurrency(totalLiabilities)}</span>
        </span>
      </div>
    </div>
  );
}
