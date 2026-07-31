"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodSelector } from "@/components/reports/PeriodSelector";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { CategoryBreakdownChart } from "@/components/reports/CategoryBreakdownChart";
import { TrendChart } from "@/components/reports/TrendChart";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useReport } from "@/hooks/use-report";
import { useCategories } from "@/hooks/use-categories";
import { shiftPeriod, type ReportPeriodType } from "@/lib/reports";

export default function ReportsPage() {
  const { t } = useLanguage();
  const [periodType, setPeriodType] = useState<ReportPeriodType>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const { data: categories = [] } = useCategories();
  const { range, summary, expenseBreakdown, incomeBreakdown, trend, isLoading } = useReport(
    periodType,
    anchor,
  );

  function handlePeriodTypeChange(next: ReportPeriodType) {
    setPeriodType(next);
    setAnchor(new Date());
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("reports.title")}</h1>
        <ExportButtons range={range} />
      </div>

      <PeriodSelector
        periodType={periodType}
        onPeriodTypeChange={handlePeriodTypeChange}
        range={range}
        onPrev={() => setAnchor((d) => shiftPeriod(periodType, d, -1))}
        onNext={() => setAnchor((d) => shiftPeriod(periodType, d, 1))}
        onToday={() => setAnchor(new Date())}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <>
          <ReportSummaryCards summary={summary} />

          <Card>
            <CardHeader>
              <CardTitle>{t("reports.trend")}</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart buckets={trend} periodType={periodType} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("reports.expenseByCategory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBreakdownChart entries={expenseBreakdown} categories={categories} />
            </CardContent>
          </Card>

          {incomeBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.incomeByCategory")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBreakdownChart entries={incomeBreakdown} categories={categories} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
