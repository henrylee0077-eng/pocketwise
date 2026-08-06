// Local-first replacement for the old Supabase-backed transactions query
// layer. Reads/writes go straight to IndexedDB (via Dexie) instead of
// Postgres. Filtering happens in plain JS over an in-memory array — at the
// data volumes a personal finance app produces (thousands of rows, not
// millions) this is simpler and just as fast as building a Dexie compound
// query, and it mirrors the old Supabase `.eq()`/`.in()` chains almost
// line for line, which kept this rewrite low-risk.
import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import type { LocalTransaction } from "@/lib/local-db/schema";
import type { TransactionFilters, TransactionWithTags } from "@/types";
import type { TransactionFormValues } from "@/lib/validations";

export interface DateRange {
  /** Inclusive, ISO yyyy-MM-dd */
  start: string;
  /** Inclusive, ISO yyyy-MM-dd */
  end: string;
}

function toTransactionWithTags(t: LocalTransaction): TransactionWithTags {
  const { tagIds, ...rest } = t;
  return { ...rest, tagIds };
}

function sortByDateDesc(a: LocalTransaction, b: LocalTransaction): number {
  if (a.expense_date !== b.expense_date) return a.expense_date < b.expense_date ? 1 : -1;
  return a.created_at < b.created_at ? 1 : -1;
}

/**
 * Fetches transactions in a date range (optionally further narrowed by
 * `filters`) along with the tag ids attached to each one.
 */
export async function fetchTransactionsForRange(
  range: DateRange,
  filters: TransactionFilters = {},
): Promise<TransactionWithTags[]> {
  const from = filters.dateFrom ?? range.start;
  const to = filters.dateTo ?? range.end;

  let rows = await db.transactions
    .where("expense_date")
    .between(from, to, true, true)
    .toArray();

  if (filters.type) rows = rows.filter((t) => t.type === filters.type);
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    const wanted = new Set(filters.categoryIds);
    rows = rows.filter((t) => t.category_id && wanted.has(t.category_id));
  }
  if (filters.paymentMethodIds && filters.paymentMethodIds.length > 0) {
    const wanted = new Set(filters.paymentMethodIds);
    rows = rows.filter((t) => t.payment_method_id && wanted.has(t.payment_method_id));
  }
  if (filters.accountIds && filters.accountIds.length > 0) {
    const wanted = new Set(filters.accountIds);
    rows = rows.filter((t) => t.account_id && wanted.has(t.account_id));
  }
  if (filters.priority) rows = rows.filter((t) => t.priority === filters.priority);
  if (filters.merchantQuery && filters.merchantQuery.trim().length > 0) {
    const needle = filters.merchantQuery.trim().toLowerCase();
    rows = rows.filter((t) => t.merchant?.toLowerCase().includes(needle));
  }
  if (filters.tagIds && filters.tagIds.length > 0) {
    const wanted = new Set(filters.tagIds);
    rows = rows.filter((t) => t.tagIds.some((tagId) => wanted.has(tagId)));
  }

  return rows.sort(sortByDateDesc).map(toTransactionWithTags);
}

/**
 * Every transaction that touches a specific account — as its own
 * account_id (expense/income/transfer-out) OR as a transfer's
 * to_account_id (transfer-in). Not date-bounded — an account detail page
 * shows its full history.
 */
export async function fetchAccountTransactions(accountId: string): Promise<TransactionWithTags[]> {
  const rows = await db.transactions
    .filter((t) => t.account_id === accountId || t.to_account_id === accountId)
    .toArray();

  return rows.sort(sortByDateDesc).map(toTransactionWithTags);
}

/** Full history of expense transactions linked to one spending project. */
export async function fetchProjectTransactions(projectId: string): Promise<TransactionWithTags[]> {
  const rows = await db.transactions.where("project_id").equals(projectId).toArray();
  return rows.sort(sortByDateDesc).map(toTransactionWithTags);
}

/** A single transaction by id — used by the edit page. */
export async function fetchTransactionById(id: string): Promise<TransactionWithTags | null> {
  const row = await db.transactions.get(id);
  return row ? toTransactionWithTags(row) : null;
}

export async function createTransaction(values: TransactionFormValues): Promise<TransactionWithTags> {
  const timestamp = nowIso();
  const settings = await db.settings.get("singleton");
  const row: LocalTransaction = {
    id: newId(),
    user_id: LOCAL_USER_ID,
    category_id: values.type === "transfer" ? null : values.categoryId || null,
    amount: values.amount,
    currency: settings?.preferredCurrency ?? "MYR",
    note: values.note || null,
    expense_date: values.date,
    type: values.type,
    payment_method_id: values.paymentMethodId || null,
    priority: values.priority || null,
    merchant: values.merchant || null,
    account_id: values.accountId || null,
    to_account_id: values.type === "transfer" ? values.toAccountId || null : null,
    recurring_transaction_id: null,
    project_id: values.type === "expense" ? values.projectId || null : null,
    created_at: timestamp,
    updated_at: timestamp,
    tagIds: values.tagIds,
  };

  await db.transactions.add(row);
  return toTransactionWithTags(row);
}

export async function updateTransaction(
  id: string,
  values: TransactionFormValues,
): Promise<TransactionWithTags> {
  const existing = await db.transactions.get(id);
  if (!existing) throw new Error("Transaction not found");

  const updated: LocalTransaction = {
    ...existing,
    category_id: values.type === "transfer" ? null : values.categoryId || null,
    amount: values.amount,
    note: values.note || null,
    expense_date: values.date,
    type: values.type,
    payment_method_id: values.paymentMethodId || null,
    priority: values.priority || null,
    merchant: values.merchant || null,
    account_id: values.accountId || null,
    to_account_id: values.type === "transfer" ? values.toAccountId || null : null,
    project_id: values.type === "expense" ? values.projectId || null : null,
    updated_at: nowIso(),
    tagIds: values.tagIds,
  };

  await db.transactions.put(updated);
  return toTransactionWithTags(updated);
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
}
