"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { fetchBudgetForMonth, fetchBudgetHistory, upsertBudget } from "@/lib/queries/budgets";
import type { BudgetFormValues } from "@/lib/validations";

export function useBudget(monthIso: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["budget", user?.id, monthIso],
    queryFn: () => fetchBudgetForMonth(createClient(), monthIso),
    enabled: !!user,
  });
}

export function useBudgetHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["budget-history", user?.id],
    queryFn: () => fetchBudgetHistory(createClient()),
    enabled: !!user,
  });
}

export function useUpsertBudget(monthIso: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: BudgetFormValues) => {
      if (!user) throw new Error("Not authenticated");
      return upsertBudget(createClient(), user.id, monthIso, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget", user?.id, monthIso] });
      queryClient.invalidateQueries({ queryKey: ["budget-history", user?.id] });
    },
  });
}
