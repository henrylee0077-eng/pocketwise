"use client";

import { useMemo } from "react";
import { monthKey } from "@/lib/utils";
import { computeDashboardSummary } from "@/lib/dashboard";
import { useBudget } from "@/hooks/use-budget";
import { useCategoryBudgets } from "@/hooks/use-category-budgets";
import { useMonthTransactions } from "@/hooks/use-transactions";

export function useDashboard() {
  const currentMonthIso = monthKey();
  const transactionsQuery = useMonthTransactions(currentMonthIso);
  const budgetQuery = useBudget(currentMonthIso);
  const categoryBudgetsQuery = useCategoryBudgets(currentMonthIso);

  const summary = useMemo(() => {
    if (!transactionsQuery.data) return null;
    return computeDashboardSummary(
      transactionsQuery.data,
      budgetQuery.data ?? null,
      categoryBudgetsQuery.data ?? [],
    );
  }, [transactionsQuery.data, budgetQuery.data, categoryBudgetsQuery.data]);

  return {
    summary,
    transactions: transactionsQuery.data ?? [],
    isLoading:
      transactionsQuery.isLoading || budgetQuery.isLoading || categoryBudgetsQuery.isLoading,
    isError: transactionsQuery.isError || budgetQuery.isError || categoryBudgetsQuery.isError,
  };
}
