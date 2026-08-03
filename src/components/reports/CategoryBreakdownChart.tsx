"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CategoryIcon, categoryName } from "@/components/transactions/CategoryPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useFormatCurrency } from "@/hooks/use-currency";
import type { CategoryBreakdownEntry } from "@/lib/reports";
import type { Category } from "@/types";

export function CategoryBreakdownChart({
  entries,
  categories,
}: {
  entries: CategoryBreakdownEntry[];
  categories: Category[];
}) {
  const { locale, t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  if (entries.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        {t("reports.noData")}
      </div>
    );
  }

  const data = entries.map((e) => ({
    name: categoryMap.get(e.categoryId) ? categoryName(categoryMap.get(e.categoryId)!, locale) : "—",
    value: e.total,
    color: categoryMap.get(e.categoryId)?.color ?? "#6B7280",
  }));

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {entries.slice(0, 6).map((entry) => {
          const category = categoryMap.get(entry.categoryId);
          return (
            <div key={entry.categoryId} className="flex items-center gap-2 text-sm">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${category?.color ?? "#6B7280"}22`, color: category?.color ?? "#6B7280" }}
              >
                <CategoryIcon name={category?.icon ?? "MoreHorizontal"} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {category ? categoryName(category, locale) : "—"}
              </span>
              <span className="shrink-0 font-medium text-foreground">{formatCurrency(entry.total)}</span>
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {entry.percent.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
