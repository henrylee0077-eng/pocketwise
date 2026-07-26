"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfMonth, parseISO } from "date-fns";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  createExpense,
  deleteExpense,
  fetchExpensesForRange,
  updateExpense,
} from "@/lib/queries/expenses";
import { formatInputDate } from "@/lib/utils";
import type { ExpenseFormValues } from "@/lib/validations";

function rangeForMonth(monthIso: string) {
  const start = parseISO(monthIso);
  return { start: monthIso, end: formatInputDate(endOfMonth(start)) };
}

export function useMonthExpenses(monthIso: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["expenses", user?.id, monthIso],
    queryFn: () => fetchExpensesForRange(createClient(), rangeForMonth(monthIso)),
    enabled: !!user,
  });
}

export function useCreateExpense() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ExpenseFormValues) => {
      if (!user) throw new Error("Not authenticated");
      return createExpense(createClient(), user.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", user?.id] });
    },
  });
}

export function useUpdateExpense() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ExpenseFormValues }) =>
      updateExpense(createClient(), id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", user?.id] });
    },
  });
}

export function useDeleteExpense() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExpense(createClient(), id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", user?.id] });
    },
  });
}
