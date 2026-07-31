"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfMonth, parseISO } from "date-fns";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  createTransaction,
  deleteTransaction,
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
    },
  });
}
