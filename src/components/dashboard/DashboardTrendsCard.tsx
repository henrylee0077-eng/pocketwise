"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/reports/TrendChart";
import { CategoryBreakdownChart } from "@/components/reports/CategoryBreakdownChart";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useReport } from "@/hooks/use-report";
import { useCategories } from "@/hooks/use-categories";

export function DashboardTrendsCard() {
  const { t } = useLanguage();
  const { data: categories = [] } = useCategories();
  const { trend, expenseBreakdown, isLoading } = useReport("month", new Date());

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("reports.title")}</h2>
        <Link href="/reports" className="flex items-center gap-0.5 text-sm font-medium text-primary">
          {t("dashboard.viewAll")}
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.trend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart buckets={trend} periodType="month" />
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
    </div>
  );
}
