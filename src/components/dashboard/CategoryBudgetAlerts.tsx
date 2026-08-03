"use client";

import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { categoryName } from "@/components/transactions/CategoryPicker";
import { useFormatCurrency } from "@/hooks/use-currency";
import type { DashboardSummary } from "@/types";

export function CategoryBudgetAlerts({ summary }: { summary: DashboardSummary }) {
  const { locale, t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const { data: categories = [] } = useCategories();

  const flagged = summary.categoryBudgets.filter((cb) => cb.warningTriggered || cb.exceeded);
  if (flagged.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {flagged.map((status) => {
        const category = categories.find((c) => c.id === status.categoryId);
        return (
          <div
            key={status.categoryId}
            className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3.5"
          >
            <AlertTriangle className="size-4 shrink-0 text-warning-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {category ? categoryName(category, locale) : t("common.error")}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(status.spent)} / {formatCurrency(Number(status.budget.amount))}
                {" · "}
                {Math.round(status.usagePercent)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
