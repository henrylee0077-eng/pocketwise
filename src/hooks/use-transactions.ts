"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfMonth, parseISO } from "date-fns";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
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
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id, monthIso, filters],
    queryFn: () => fetchTransactionsForRange(createClient(), rangeForMonth(monthIso), filters),
    enabled: !!user,
  });
}

/** Fetches transactions for an arbitrary [start, end] ISO date range — used by reports. */
export function useTransactionsForRange(startIso: string, endIso: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id, "range", startIso, endIso],
    queryFn: () => fetchTransactionsForRange(createClient(), { start: startIso, end: endIso }),
    enabled: !!user,
  });
}

/** Full transaction history for one account (both as source and transfer destination) — used by the account detail page. */
export function useAccountTransactions(accountId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id, "account", accountId],
    queryFn: () => fetchAccountTransactions(createClient(), accountId),
    enabled: !!user && !!accountId,
  });
}

/** Full history of expense transactions linked to one spending project — used by the project detail page. */
export function useProjectTransactions(projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id, "project", projectId],
    queryFn: () => fetchProjectTransactions(createClient(), projectId),
    enabled: !!user && !!projectId,
  });
}

export function useCreateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: TransactionFormValues) => {
      if (!user) throw new Error("Not authenticated");
      return createTransaction(createClient(), user.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TransactionFormValues }) =>
      updateTransaction(createClient(), id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(createClient(), id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
