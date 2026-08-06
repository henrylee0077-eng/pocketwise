import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import type { RecurringTransaction } from "@/types";
import type { RecurringTransactionFormValues } from "@/lib/validations";

export async function fetchRecurringTransactions(): Promise<RecurringTransaction[]> {
  const rows = await db.recurringTransactions.toArray();
  return rows.sort((a, b) => (a.next_run_date < b.next_run_date ? -1 : 1));
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
  values: RecurringTransactionFormValues,
): Promise<RecurringTransaction> {
  const row = toRow(values);
  const timestamp = nowIso();
  const record: RecurringTransaction = {
    id: newId(),
    user_id: LOCAL_USER_ID,
    next_run_date: row.start_date,
    last_generated_date: null,
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
    ...row,
  };
  await db.recurringTransactions.add(record);
  return record;
}

export async function updateRecurringTransaction(
  id: string,
  values: RecurringTransactionFormValues,
): Promise<RecurringTransaction> {
  const existing = await db.recurringTransactions.get(id);
  if (!existing) throw new Error("Recurring transaction not found");
  const updated: RecurringTransaction = { ...existing, ...toRow(values), updated_at: nowIso() };
  await db.recurringTransactions.put(updated);
  return updated;
}

export async function setRecurringTransactionActive(id: string, isActive: boolean): Promise<void> {
  await db.recurringTransactions.update(id, { is_active: isActive, updated_at: nowIso() });
}

/**
 * Deletes a recurring rule. Transactions it already generated keep
 * existing — only their back-reference is cleared (recurring_transaction_id
 * -> null), mirroring the old `on delete set null` foreign key.
 */
export async function deleteRecurringTransaction(id: string): Promise<void> {
  await db.transaction("rw", db.recurringTransactions, db.transactions, async () => {
    const generated = await db.transactions
      .where("recurring_transaction_id")
      .equals(id)
      .toArray();
    await Promise.all(
      generated.map((t) =>
        db.transactions.update(t.id, { recurring_transaction_id: null, updated_at: nowIso() }),
      ),
    );
    await db.recurringTransactions.delete(id);
  });
}
