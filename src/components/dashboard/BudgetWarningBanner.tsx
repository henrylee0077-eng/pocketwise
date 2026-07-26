"use client";

import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { DashboardSummary } from "@/types";

export function BudgetWarningBanner({ summary }: { summary: DashboardSummary }) {
  const { t } = useLanguage();

  if (!summary.warningTriggered || summary.budgetExhausted) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
      <div>
        <p className="text-sm font-semibold text-foreground">{t("budgetWarning.title")}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("budgetWarning.body", { percent: Math.round(summary.usagePercent ?? 0) })}
        </p>
      </div>
    </div>
  );
}
