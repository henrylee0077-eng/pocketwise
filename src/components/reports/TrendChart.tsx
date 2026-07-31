"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/utils";
import type { ReportPeriodType, TrendBucket } from "@/lib/reports";

function labelFormatter(periodType: ReportPeriodType, locale: "en" | "zh") {
  const intlLocale = locale === "zh" ? "zh-CN" : "en-MY";
  if (periodType === "year") {
    const fmt = new Intl.DateTimeFormat(intlLocale, { month: "short" });
    return (d: Date) => fmt.format(d);
  }
  if (periodType === "week") {
    const fmt = new Intl.DateTimeFormat(intlLocale, { weekday: "short" });
    return (d: Date) => fmt.format(d);
  }
  const fmt = new Intl.DateTimeFormat(intlLocale, { day: "numeric" });
  return (d: Date) => fmt.format(d);
}

export function TrendChart({ buckets, periodType }: { buckets: TrendBucket[]; periodType: ReportPeriodType }) {
  const { locale, t } = useLanguage();
  const format = labelFormatter(periodType, locale);

  const data = buckets.map((b) => ({
    label: format(b.date),
    income: Number(b.income.toFixed(2)),
    expense: Number(b.expense.toFixed(2)),
  }));

  if (buckets.every((b) => b.income === 0 && b.expense === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        {t("reports.noData")}
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            interval={periodType === "month" ? 4 : 0}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "var(--secondary)" }}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value) => formatCurrency(Number(value))}
          />
          <Bar dataKey="income" fill="var(--primary)" radius={[4, 4, 0, 0]} name={t("transactions.typeIncome")} />
          <Bar dataKey="expense" fill="var(--destructive)" radius={[4, 4, 0, 0]} name={t("transactions.typeExpense")} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
