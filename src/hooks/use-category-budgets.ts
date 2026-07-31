"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  deleteCategoryBudget,
  fetchCategoryBudgetsForMonth,
  upsertCategoryBudget,
} from "@/lib/queries/category-budgets";
import type { CategoryBudgetFormValues } from "@/lib/validations";

export function useCategoryBudgets(monthIso: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["category-budgets", user?.id, monthIso],
    queryFn: () => fetchCategoryBudgetsForMonth(createClient(), monthIso),
    enabled: !!user,
  });
}

export function useUpsertCategoryBudget(monthIso: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CategoryBudgetFormValues) => {
      if (!user) throw new Error("Not authenticated");
      return upsertCategoryBudget(createClient(), user.id, monthIso, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-budgets", user?.id, monthIso] });
    },
  });
}

export function useDeleteCategoryBudget(monthIso: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategoryBudget(createClient(), id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-budgets", user?.id, monthIso] });
    },
  });
}
