"use client";

import { useMemo } from "react";
import { useTransactionsForRange } from "@/hooks/use-transactions";
import {
  computeCategoryBreakdown,
  computeReportSummary,
  computeTrendBuckets,
  getPeriodRange,
  type ReportPeriodType,
} from "@/lib/reports";

export function useReport(periodType: ReportPeriodType, anchor: Date) {
  const range = useMemo(() => getPeriodRange(periodType, anchor), [periodType, anchor]);
  const query = useTransactionsForRange(range.startIso, range.endIso);
  const transactions = useMemo(() => query.data ?? [], [query.data]);

  const summary = useMemo(() => computeReportSummary(transactions, range), [transactions, range]);
  const expenseBreakdown = useMemo(
    () => computeCategoryBreakdown(transactions, "expense"),
    [transactions],
  );
  const incomeBreakdown = useMemo(
    () => computeCategoryBreakdown(transactions, "income"),
    [transactions],
  );
  const trend = useMemo(
    () => computeTrendBuckets(transactions, periodType, range),
    [transactions, periodType, range],
  );

  return {
    range,
    transactions,
    summary,
    expenseBreakdown,
    incomeBreakdown,
    trend,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
