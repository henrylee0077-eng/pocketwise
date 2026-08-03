"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useFormatCurrency } from "@/hooks/use-currency";
import type { DashboardSummary } from "@/types";

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const { t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const remainingIsNegative = (summary.remainingBudget ?? 0) < 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">{t("dashboard.todaySpending")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatCurrency(summary.todayExpenseTotal)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">{t("dashboard.monthSpending")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatCurrency(summary.monthExpenseTotal)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">{t("dashboard.remainingBudget")}</p>
          <p
            className={
              "mt-1 text-xl font-semibold tabular-nums " +
              (remainingIsNegative ? "text-destructive" : "")
            }
          >
            {summary.remainingBudget === null ? "—" : formatCurrency(summary.remainingBudget)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">{t("dashboard.daysLeft")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {summary.daysRemainingIncludingToday} {t("dashboard.daysLeftUnit")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
