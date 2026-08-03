import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Account, AccountBalance } from "@/types";
import type { AccountFormValues } from "@/lib/validations";

export async function fetchAccountBalances(
  supabase: SupabaseClient<Database>,
): Promise<AccountBalance[]> {
  const { data, error } = await supabase
    .from("account_balances")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

function toRow(values: AccountFormValues) {
  return {
    name: values.name,
    type: values.type,
    institution: values.institution || null,
    opening_balance: values.openingBalance,
    color: values.color,
    icon: values.icon,
    credit_limit: values.creditLimit ?? null,
    interest_rate: values.interestRate ?? null,
    statement_day: values.statementDay ?? null,
    payment_due_day: values.paymentDueDay ?? null,
    min_payment_percent: values.minPaymentPercent ?? null,
  };
}

export async function createAccount(
  supabase: SupabaseClient<Database>,
  userId: string,
  values: AccountFormValues,
  currency: string,
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .insert({ user_id: userId, currency, ...toRow(values) })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateAccount(
  supabase: SupabaseClient<Database>,
  id: string,
  values: AccountFormValues,
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .update(toRow(values))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setAccountArchived(
  supabase: SupabaseClient<Database>,
  id: string,
  isArchived: boolean,
): Promise<void> {
  const { error } = await supabase.from("accounts").update({ is_archived: isArchived }).eq("id", id);
  if (error) throw error;
}

export async function deleteAccount(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}
