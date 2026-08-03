"use client";

import { useCallback } from "react";
import { useProfile } from "@/hooks/use-security";
import { formatCurrency } from "@/lib/utils";

/** The signed-in user's chosen display currency (ISO 4217 code), defaulting to MYR until the profile loads. */
export function usePreferredCurrency(): string {
  const { data: profile } = useProfile();
  return profile?.preferred_currency ?? "MYR";
}

/**
 * Returns a `formatCurrency(amount)` function bound to the current user's
 * preferred currency, so components never have to thread the currency code
 * through themselves. Prefer this over importing `formatCurrency` from
 * `@/lib/utils` directly in any component that renders money to the user.
 */
export function useFormatCurrency(): (amount: number) => string {
  const currency = usePreferredCurrency();
  return useCallback((amount: number) => formatCurrency(amount, currency), [currency]);
}
