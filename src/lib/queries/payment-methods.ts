import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PaymentMethod } from "@/types";

export async function fetchPaymentMethods(
  supabase: SupabaseClient<Database>,
): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}
