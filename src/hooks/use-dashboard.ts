"use client";

import { useMemo } from "react";
import { monthKey } from "@/lib/utils";
import { computeDashboardSummary } from "@/lib/dashboard";
import { useBudget } from "@/hooks/use-budget";
import { useMonthExpenses } from "@/hooks/use-expenses";

export function useDashboard() {
  const currentMonthIso = monthKey();
  const expensesQuery = useMonthExpenses(currentMonthIso);
  const budgetQuery = useBudget(currentMonthIso);

  const summary = useMemo(() => {
    if (!expensesQuery.data) return null;
    return computeDashboardSummary(expensesQuery.data, budgetQuery.data ?? null);
  }, [expensesQuery.data, budgetQuery.data]);

  return {
    summary,
    expenses: expensesQuery.data ?? [],
    isLoading: expensesQuery.isLoading || budgetQuery.isLoading,
    isError: expensesQuery.isError || budgetQuery.isError,
  };
}
