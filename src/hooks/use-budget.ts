"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import { fetchBudgetForMonth, fetchBudgetHistory, upsertBudget } from "@/lib/queries/budgets";
import type { BudgetFormValues } from "@/lib/validations";

export function useBudget(monthIso: string) {
  return useLocalQuery(() => fetchBudgetForMonth(monthIso), [monthIso]);
}

export function useBudgetHistory() {
  return useLocalQuery(() => fetchBudgetHistory(), []);
}

export function useUpsertBudget(monthIso: string) {
  return useMutation({
    mutationFn: (values: BudgetFormValues) => upsertBudget(monthIso, values),
  });
}
