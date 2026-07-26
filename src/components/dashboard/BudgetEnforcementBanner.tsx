"use client";

import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { DashboardSummary } from "@/types";

export function BudgetEnforcementBanner({ summary }: { summary: DashboardSummary }) {
  const { t } = useLanguage();

  if (!summary.budgetExhausted) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div>
        <p className="text-sm font-semibold text-destructive">{t("budgetEnforcement.title")}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("budgetEnforcement.body")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("budgetEnforcement.essentialStillAllowed")}
        </p>
      </div>
    </div>
  );
}
