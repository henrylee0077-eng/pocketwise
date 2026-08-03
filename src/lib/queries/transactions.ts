import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Transaction, TransactionFilters, TransactionWithTags } from "@/types";
import type { TransactionFormValues } from "@/lib/validations";

export interface DateRange {
  /** Inclusive, ISO yyyy-MM-dd */
  start: string;
  /** Inclusive, ISO yyyy-MM-dd */
  end: string;
}

/** Fetches and merges tag ids for a batch of transactions in one extra query. */
async function attachTags(
  supabase: SupabaseClient<Database>,
  transactions: Transaction[],
): Promise<TransactionWithTags[]> {
  if (transactions.length === 0) return [];

  const ids = transactions.map((t) => t.id);
  const { data: tagLinks, error: tagError } = await supabase
    .from("transaction_tags")
    .select("transaction_id, tag_id")
    .in("transaction_id", ids);
  if (tagError) throw tagError;

  const tagsByTransaction = new Map<string, string[]>();
  for (const link of tagLinks ?? []) {
    const existing = tagsByTransaction.get(link.transaction_id) ?? [];
    existing.push(link.tag_id);
    tagsByTransaction.set(link.transaction_id, existing);
  }

  return transactions.map((t) => ({
    ...t,
    tagIds: tagsByTransaction.get(t.id) ?? [],
  }));
}

/**
 * Fetches transactions in a date range (optionally further narrowed by
 * `filters`) along with the tag ids attached to each one. Tags are fetched
 * in a second query and merged client-side to keep the main query simple.
 */
export async function fetchTransactionsForRange(
  supabase: SupabaseClient<Database>,
  range: DateRange,
  filters: TransactionFilters = {},
): Promise<TransactionWithTags[]> {
  let query = supabase
    .from("transactions")
    .select("*")
    .gte("expense_date", filters.dateFrom ?? range.start)
    .lte("expense_date", filters.dateTo ?? range.end)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    query = query.in("category_id", filters.categoryIds);
  }
  if (filters.paymentMethodIds && filters.paymentMethodIds.length > 0) {
    query = query.in("payment_method_id", filters.paymentMethodIds);
  }
  if (filters.accountIds && filters.accountIds.length > 0) {
    query = query.in("account_id", filters.accountIds);
  }
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.merchantQuery && filters.merchantQuery.trim().length > 0) {
    query = query.ilike("merchant", `%${filters.merchantQuery.trim()}%`);
  }

  const { data: transactions, error } = await query;
  if (error) throw error;

  let result = await attachTags(supabase, transactions ?? []);

  if (filters.tagIds && filters.tagIds.length > 0) {
    const wanted = new Set(filters.tagIds);
    result = result.filter((t) => t.tagIds.some((tagId) => wanted.has(tagId)));
  }

  return result;
}

/**
 * Every transaction that touches a specific account — as its own account_id
 * (expense/income/transfer-out) OR as a transfer's to_account_id
 * (transfer-in). Matches exactly what `account_balances.current_balance`
 * sums, so this is the "statement" view for that account. Unlike
 * `fetchTransactionsForRange`, this isn't date-bounded — an account detail
 * page shows its full history.
 */
export async function fetchAccountTransactions(
  supabase: SupabaseClient<Database>,
  accountId: string,
): Promise<TransactionWithTags[]> {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return attachTags(supabase, transactions ?? []);
}

/**
 * Full history of expense transactions linked to one spending project.
 * Unlike `fetchAccountTransactions`, this is a plain equality filter — a
 * transaction is either linked to a project or it isn't, no "touches it as
 * source or destination" ambiguity like accounts have with transfers.
 */
export async function fetchProjectTransactions(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<TransactionWithTags[]> {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("project_id", projectId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return attachTags(supabase, transactions ?? []);
}

async function setTransactionTags(
  supabase: SupabaseClient<Database>,
  transactionId: string,
  tagIds: string[],
) {
  const { error: deleteError } = await supabase
    .from("transaction_tags")
    .delete()
    .eq("transaction_id", transactionId);
  if (deleteError) throw deleteError;

  if (tagIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("transaction_tags")
    .insert(tagIds.map((tagId) => ({ transaction_id: transactionId, tag_id: tagId })));
  if (insertError) throw insertError;
}

export async function createTransaction(
  supabase: SupabaseClient<Database>,
  userId: string,
  values: TransactionFormValues,
): Promise<TransactionWithTags> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      category_id: values.type === "transfer" ? null : values.categoryId || null,
      amount: values.amount,
      type: values.type,
      expense_date: values.date,
      payment_method_id: values.paymentMethodId || null,
      priority: values.priority || null,
      merchant: values.merchant || null,
      note: values.note || null,
      account_id: values.accountId || null,
      to_account_id: values.type === "transfer" ? values.toAccountId || null : null,
      project_id: values.type === "expense" ? values.projectId || null : null,
    })
    .select("*")
    .single();

  if (error) throw error;

  if (values.tagIds.length > 0) {
    await setTransactionTags(supabase, data.id, values.tagIds);
  }

  return { ...data, tagIds: values.tagIds };
}

export async function updateTransaction(
  supabase: SupabaseClient<Database>,
  id: string,
  values: TransactionFormValues,
): Promise<TransactionWithTags> {
  const { data, error } = await supabase
    .from("transactions")
    .update({
      category_id: values.type === "transfer" ? null : values.categoryId || null,
      amount: values.amount,
      type: values.type,
      expense_date: values.date,
      payment_method_id: values.paymentMethodId || null,
      priority: values.priority || null,
      merchant: values.merchant || null,
      note: values.note || null,
      account_id: values.accountId || null,
      to_account_id: values.type === "transfer" ? values.toAccountId || null : null,
      project_id: values.type === "expense" ? values.projectId || null : null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  await setTransactionTags(supabase, id, values.tagIds);

  return { ...data, tagIds: values.tagIds };
}

export async function deleteTransaction(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
