import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { RecurringTransaction } from "@/types";
import type { RecurringTransactionFormValues } from "@/lib/validations";

export async function fetchRecurringTransactions(
  supabase: SupabaseClient<Database>,
): Promise<RecurringTransaction[]> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .order("next_run_date", { ascending: true });

  if (error) throw error;
  return data;
}

function toRow(values: RecurringTransactionFormValues) {
  return {
    type: values.type,
    amount: values.amount,
    category_id: values.type === "transfer" ? null : values.categoryId || null,
    account_id: values.accountId || null,
    to_account_id: values.type === "transfer" ? values.toAccountId || null : null,
    payment_method_id: values.paymentMethodId || null,
    priority: values.priority || null,
    merchant: values.merchant || null,
    note: values.note || null,
    frequency: values.frequency,
    interval_count: values.intervalCount,
    start_date: values.startDate,
    end_date: values.endDate || null,
  };
}

export async function createRecurringTransaction(
  supabase: SupabaseClient<Database>,
  userId: string,
  values: RecurringTransactionFormValues,
): Promise<RecurringTransaction> {
  const row = toRow(values);
  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert({ user_id: userId, next_run_date: row.start_date, ...row })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecurringTransaction(
  supabase: SupabaseClient<Database>,
  id: string,
  values: RecurringTransactionFormValues,
): Promise<RecurringTransaction> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .update(toRow(values))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setRecurringTransactionActive(
  supabase: SupabaseClient<Database>,
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRecurringTransaction(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
  if (error) throw error;
}
