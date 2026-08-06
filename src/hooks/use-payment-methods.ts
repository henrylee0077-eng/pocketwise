"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import { createPaymentMethod, fetchPaymentMethods } from "@/lib/queries/payment-methods";

export function usePaymentMethods() {
  return useLocalQuery(() => fetchPaymentMethods(), []);
}

/** Used by quick-add's escape hatch for a payment rail that isn't in the
 * default list yet — there's no dedicated "add payment method" screen. */
export function useCreatePaymentMethod() {
  return useMutation({
    mutationFn: (values: { nameEn: string; nameZh: string; icon?: string }) =>
      createPaymentMethod(values),
  });
}
