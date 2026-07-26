"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/utils";
import type { DashboardSummary } from "@/types";

export function RecommendedDailyBudget({ summary }: { summary: DashboardSummary }) {
  const { t } = useLanguage();

  if (summary.recommendedDailyBudget === null) return null;

  return (
    <Card className="border-primary/20 bg-accent">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-medium text-primary">{t("dashboard.recommendedDaily")}</p>
          <p className="text-[11px] text-muted-foreground">{t("dashboard.recommendedDailyHint")}</p>
        </div>
        <p className="text-2xl font-bold tabular-nums text-primary">
          {formatCurrency(summary.recommendedDailyBudget)}
        </p>
      </CardContent>
    </Card>
  );
}
