import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PaymentMethod } from "@/types";
import { slugify } from "@/lib/utils";

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

export async function createPaymentMethod(
  supabase: SupabaseClient<Database>,
  userId: string,
  values: { nameEn: string; nameZh: string; icon?: string },
): Promise<PaymentMethod> {
  const { data, error } = await supabase
    .from("payment_methods")
    .insert({
      user_id: userId,
      key: slugify(values.nameEn),
      name_en: values.nameEn,
      name_zh: values.nameZh,
      icon: values.icon ?? "Wallet",
      sort_order: 100,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
