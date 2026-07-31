"use client";

import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/utils";
import type { ReportSummary } from "@/lib/reports";

export function ReportSummaryCards({ summary }: { summary: ReportSummary }) {
  const { t } = useLanguage();

  const items = [
    { label: t("dashboard.monthSpending"), value: summary.totalExpense, tone: "text-foreground" },
    { label: t("transactions.monthIncome"), value: summary.totalIncome, tone: "text-primary" },
    {
      label: t("reports.net"),
      value: summary.net,
      tone: summary.net >= 0 ? "text-primary" : "text-destructive",
    },
    { label: t("reports.avgPerDay"), value: summary.avgExpensePerDay, tone: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className={`mt-1 text-lg font-semibold tracking-tight ${item.tone}`}>
            {formatCurrency(item.value)}
          </p>
        </Card>
      ))}
    </div>
  );
}
