"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import {
  deleteCategoryBudget,
  fetchCategoryBudgetsForMonth,
  upsertCategoryBudget,
} from "@/lib/queries/category-budgets";
import type { CategoryBudgetFormValues } from "@/lib/validations";

export function useCategoryBudgets(monthIso: string) {
  return useLocalQuery(() => fetchCategoryBudgetsForMonth(monthIso), [monthIso]);
}

export function useUpsertCategoryBudget(monthIso: string) {
  return useMutation({
    mutationFn: (values: CategoryBudgetFormValues) => upsertCategoryBudget(monthIso, values),
  });
}

export function useDeleteCategoryBudget(monthIso: string) {
  return useMutation({
    mutationFn: (id: string) => deleteCategoryBudget(id),
  });
}
