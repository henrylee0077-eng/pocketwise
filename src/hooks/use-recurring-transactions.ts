"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  fetchRecurringTransactions,
  setRecurringTransactionActive,
  updateRecurringTransaction,
} from "@/lib/queries/recurring-transactions";
import type { RecurringTransactionFormValues } from "@/lib/validations";
import { useAuth } from "@/components/providers/AuthProvider";

export function useRecurringTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recurring-transactions", user?.id],
    queryFn: () => fetchRecurringTransactions(createClient()),
    enabled: Boolean(user),
    staleTime: 30_000,
  });
}

function useInvalidateRecurring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["recurring-transactions", user?.id] });
  };
}

export function useCreateRecurringTransaction() {
  const { user } = useAuth();
  const invalidate = useInvalidateRecurring();

  return useMutation({
    mutationFn: (values: RecurringTransactionFormValues) => {
      if (!user) throw new Error("Not authenticated");
      return createRecurringTransaction(createClient(), user.id, values);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateRecurringTransaction() {
  const invalidate = useInvalidateRecurring();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: RecurringTransactionFormValues }) =>
      updateRecurringTransaction(createClient(), id, values),
    onSuccess: invalidate,
  });
}

export function useSetRecurringTransactionActive() {
  const invalidate = useInvalidateRecurring();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setRecurringTransactionActive(createClient(), id, isActive),
    onSuccess: invalidate,
  });
}

export function useDeleteRecurringTransaction() {
  const invalidate = useInvalidateRecurring();

  return useMutation({
    mutationFn: (id: string) => deleteRecurringTransaction(createClient(), id),
    onSuccess: invalidate,
  });
}

/** Calls the "generate now" API route, then refreshes everything it could have changed. */
export function useGenerateRecurringNow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/recurring/generate", { method: "POST" });
      if (!res.ok) throw new Error("Generation failed");
      return (await res.json()) as { rulesProcessed: number; transactionsGenerated: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
