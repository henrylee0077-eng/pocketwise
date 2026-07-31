import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  formatISO,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { Transaction } from "@/types";

export type ReportPeriodType = "week" | "month" | "year";

export interface ReportRange {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
}

/** The week/month/year containing `anchor`, as a concrete date range. Weeks start on Monday. */
export function getPeriodRange(periodType: ReportPeriodType, anchor: Date): ReportRange {
  const start =
    periodType === "week"
      ? startOfWeek(anchor, { weekStartsOn: 1 })
      : periodType === "month"
        ? startOfMonth(anchor)
        : startOfYear(anchor);
  const end =
    periodType === "week"
      ? endOfWeek(anchor, { weekStartsOn: 1 })
      : periodType === "month"
        ? endOfMonth(anchor)
        : endOfYear(anchor);
  return {
    start,
    end,
    startIso: formatISO(start, { representation: "date" }),
    endIso: formatISO(end, { representation: "date" }),
  };
}

/** Moves the anchor date to the previous/next period of the same type. */
export function shiftPeriod(periodType: ReportPeriodType, anchor: Date, direction: 1 | -1): Date {
  if (periodType === "week") return addWeeks(anchor, direction);
  if (periodType === "month") return addMonths(anchor, direction);
  return addYears(anchor, direction);
}

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  avgExpensePerDay: number;
}

export function computeReportSummary(transactions: Transaction[], range: ReportRange): ReportSummary {
  const expense = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");
  const totalExpense = expense.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
  const days = Math.max(1, eachDayOfInterval({ start: range.start, end: range.end }).length);

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    transactionCount: transactions.filter((t) => t.type !== "transfer").length,
    avgExpensePerDay: totalExpense / days,
  };
}

export interface CategoryBreakdownEntry {
  categoryId: string;
  total: number;
  percent: number;
}

/** Category totals for one transaction type, sorted highest spend first. */
export function computeCategoryBreakdown(
  transactions: Transaction[],
  type: "expense" | "income",
): CategoryBreakdownEntry[] {
  const filtered = transactions.filter((t) => t.type === type && t.category_id);
  const grandTotal = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
  if (grandTotal === 0) return [];

  const totals = new Map<string, number>();
  for (const t of filtered) {
    const key = t.category_id as string;
    totals.set(key, (totals.get(key) ?? 0) + Number(t.amount));
  }

  return Array.from(totals.entries())
    .map(([categoryId, total]) => ({ categoryId, total, percent: (total / grandTotal) * 100 }))
    .sort((a, b) => b.total - a.total);
}

export interface TrendBucket {
  /** ISO date (day buckets) or ISO first-of-month (month buckets) identifying this bucket. */
  key: string;
  /** A Date usable for locale-aware formatting in the UI. */
  date: Date;
  income: number;
  expense: number;
}

/**
 * Buckets transactions into a time series for charting: by day for week/month
 * reports, by month for year reports.
 */
export function computeTrendBuckets(
  transactions: Transaction[],
  periodType: ReportPeriodType,
  range: ReportRange,
): TrendBucket[] {
  if (periodType === "year") {
    const months = eachMonthOfInterval({ start: range.start, end: range.end });
    return months.map((monthDate) => {
      const inMonth = transactions.filter((t) =>
        isSameMonth(new Date(`${t.expense_date}T00:00:00`), monthDate),
      );
      return {
        key: format(monthDate, "yyyy-MM"),
        date: monthDate,
        income: inMonth.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
        expense: inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }

  const days = eachDayOfInterval({ start: range.start, end: range.end });
  return days.map((dayDate) => {
    const inDay = transactions.filter((t) => isSameDay(new Date(`${t.expense_date}T00:00:00`), dayDate));
    return {
      key: formatISO(dayDate, { representation: "date" }),
      date: dayDate,
      income: inDay.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
      expense: inDay.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    };
  });
}

export function formatPeriodLabel(
  periodType: ReportPeriodType,
  range: ReportRange,
  locale: "en" | "zh",
): string {
  const intlLocale = locale === "zh" ? "zh-CN" : "en-MY";
  if (periodType === "year") {
    return new Intl.DateTimeFormat(intlLocale, { year: "numeric" }).format(range.start);
  }
  if (periodType === "month") {
    return new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(range.start);
  }
  const fmt = new Intl.DateTimeFormat(intlLocale, { month: "short", day: "numeric" });
  return `${fmt.format(range.start)} – ${fmt.format(range.end)}`;
}
