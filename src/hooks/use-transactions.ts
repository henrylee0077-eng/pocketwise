"use client";

import { useMutation } from "@tanstack/react-query";
import { endOfMonth, parseISO } from "date-fns";
import { useLocalQuery } from "@/hooks/use-local-query";
import {
  createTransaction,
  deleteTransaction,
  fetchAccountTransactions,
  fetchProjectTransactions,
  fetchTransactionsForRange,
  updateTransaction,
} from "@/lib/queries/transactions";
import { formatInputDate } from "@/lib/utils";
import type { TransactionFormValues } from "@/lib/validations";
import type { TransactionFilters } from "@/types";

function rangeForMonth(monthIso: string) {
  const start = parseISO(monthIso);
  return { start: monthIso, end: formatInputDate(endOfMonth(start)) };
}

export function useMonthTransactions(monthIso: string, filters: TransactionFilters = {}) {
  return useLocalQuery(
    () => fetchTransactionsForRange(rangeForMonth(monthIso), filters),
    [monthIso, JSON.stringify(filters)],
  );
}

/** Fetches transactions for an arbitrary [start, end] ISO date range — used by reports. */
export function useTransactionsForRange(startIso: string, endIso: string) {
  return useLocalQuery(
    () => fetchTransactionsForRange({ start: startIso, end: endIso }),
    [startIso, endIso],
  );
}

/** Full transaction history for one account (both as source and transfer destination) — used by the account detail page. */
export function useAccountTransactions(accountId: string) {
  return useLocalQuery(
    () => (accountId ? fetchAccountTransactions(accountId) : []),
    [accountId],
  );
}

/** Full history of expense transactions linked to one spending project — used by the project detail page. */
export function useProjectTransactions(projectId: string) {
  return useLocalQuery(
    () => (projectId ? fetchProjectTransactions(projectId) : []),
    [projectId],
  );
}

export function useCreateTransaction() {
  return useMutation({
    mutationFn: (values: TransactionFormValues) => createTransaction(values),
  });
}

export function useUpdateTransaction() {
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TransactionFormValues }) =>
      updateTransaction(id, values),
  });
}

export function useDeleteTransaction() {
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
  });
}
