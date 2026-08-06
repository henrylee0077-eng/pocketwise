"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import { generateDueRecurringTransactions } from "@/lib/local-db/recurring";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  fetchRecurringTransactions,
  setRecurringTransactionActive,
  updateRecurringTransaction,
} from "@/lib/queries/recurring-transactions";
import type { RecurringTransactionFormValues } from "@/lib/validations";

export function useRecurringTransactions() {
  return useLocalQuery(() => fetchRecurringTransactions(), []);
}

export function useCreateRecurringTransaction() {
  return useMutation({
    mutationFn: (values: RecurringTransactionFormValues) => createRecurringTransaction(values),
  });
}

export function useUpdateRecurringTransaction() {
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: RecurringTransactionFormValues }) =>
      updateRecurringTransaction(id, values),
  });
}

export function useSetRecurringTransactionActive() {
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setRecurringTransactionActive(id, isActive),
  });
}

export function useDeleteRecurringTransaction() {
  return useMutation({
    mutationFn: (id: string) => deleteRecurringTransaction(id),
  });
}

/**
 * Runs the "generate due occurrences" sweep directly against the local
 * database — no server round trip. Dexie's live queries pick up every
 * table this touches (recurringTransactions, transactions) automatically,
 * so nothing needs manual invalidation afterward.
 */
export function useGenerateRecurringNow() {
  return useMutation({
    mutationFn: () => generateDueRecurringTransactions(),
  });
}
