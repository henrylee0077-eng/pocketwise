import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import { computeAccountBalances } from "@/lib/local-db/derived";
import type { Account, AccountBalance } from "@/types";
import type { AccountFormValues } from "@/lib/validations";

export async function fetchAccountBalances(): Promise<AccountBalance[]> {
  const [accounts, transactions] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
  ]);
  return computeAccountBalances(accounts, transactions);
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

export async function createAccount(values: AccountFormValues, currency: string): Promise<Account> {
  const timestamp = nowIso();
  const count = await db.accounts.count();
  const row: Account = {
    id: newId(),
    user_id: LOCAL_USER_ID,
    currency,
    is_archived: false,
    sort_order: count,
    created_at: timestamp,
    updated_at: timestamp,
    ...toRow(values),
  };
  await db.accounts.add(row);
  return row;
}

export async function updateAccount(id: string, values: AccountFormValues): Promise<Account> {
  const existing = await db.accounts.get(id);
  if (!existing) throw new Error("Account not found");
  const updated: Account = { ...existing, ...toRow(values), updated_at: nowIso() };
  await db.accounts.put(updated);
  return updated;
}

export async function setAccountArchived(id: string, isArchived: boolean): Promise<void> {
  await db.accounts.update(id, { is_archived: isArchived, updated_at: nowIso() });
}

/**
 * Deletes an account. Transactions and recurring rules that referenced it
 * (as either the source or transfer-destination account) are unlinked
 * (account_id / to_account_id -> null) rather than deleted, mirroring the
 * old `on delete set null` foreign keys — losing the account doesn't mean
 * losing the transaction history against it.
 */
export async function deleteAccount(id: string): Promise<void> {
  await db.transaction(
    "rw",
    db.accounts,
    db.transactions,
    db.recurringTransactions,
    async () => {
      const timestamp = nowIso();

      const linkedTransactions = await db.transactions
        .filter((t) => t.account_id === id || t.to_account_id === id)
        .toArray();
      await Promise.all(
        linkedTransactions.map((t) =>
          db.transactions.update(t.id, {
            account_id: t.account_id === id ? null : t.account_id,
            to_account_id: t.to_account_id === id ? null : t.to_account_id,
            updated_at: timestamp,
          }),
        ),
      );

      const linkedRules = await db.recurringTransactions
        .filter((r) => r.account_id === id || r.to_account_id === id)
        .toArray();
      await Promise.all(
        linkedRules.map((r) =>
          db.recurringTransactions.update(r.id, {
            account_id: r.account_id === id ? null : r.account_id,
            to_account_id: r.to_account_id === id ? null : r.to_account_id,
            updated_at: timestamp,
          }),
        ),
      );

      await db.accounts.delete(id);
    },
  );
}
