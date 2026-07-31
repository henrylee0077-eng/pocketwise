"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchPaymentMethods } from "@/lib/queries/payment-methods";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => fetchPaymentMethods(createClient()),
    staleTime: 5 * 60_000,
  });
}
