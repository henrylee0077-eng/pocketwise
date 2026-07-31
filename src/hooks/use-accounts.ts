"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createAccount,
  deleteAccount,
  fetchAccountBalances,
  setAccountArchived,
  updateAccount,
} from "@/lib/queries/accounts";
import type { AccountFormValues } from "@/lib/validations";
import { useAuth } from "@/components/providers/AuthProvider";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => fetchAccountBalances(createClient()),
    staleTime: 30_000,
  });
}

export function useCreateAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: AccountFormValues) => {
      if (!user) throw new Error("Not authenticated");
      return createAccount(createClient(), user.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AccountFormValues }) =>
      updateAccount(createClient(), id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useSetAccountArchived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      setAccountArchived(createClient(), id, isArchived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAccount(createClient(), id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
