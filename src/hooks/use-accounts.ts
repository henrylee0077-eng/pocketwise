"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import {
  createAccount,
  deleteAccount,
  fetchAccountBalances,
  setAccountArchived,
  updateAccount,
} from "@/lib/queries/accounts";
import type { AccountFormValues } from "@/lib/validations";
import { usePreferredCurrency } from "@/hooks/use-currency";

export function useAccounts() {
  return useLocalQuery(() => fetchAccountBalances(), []);
}

export function useCreateAccount() {
  // PocketWise is single-currency-per-user (see setPreferredCurrency), so
  // every new account is denominated in whatever the user has chosen —
  // never a hardcoded default.
  const currency = usePreferredCurrency();

  return useMutation({
    mutationFn: (values: AccountFormValues) => createAccount(values, currency),
  });
}

export function useUpdateAccount() {
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AccountFormValues }) =>
      updateAccount(id, values),
  });
}

export function useSetAccountArchived() {
  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      setAccountArchived(id, isArchived),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
  });
}
