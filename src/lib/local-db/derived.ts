// Pure, in-memory ports of the two Postgres views PocketWise used to rely
// on (`account_balances`, `project_spend`). Both were simple aggregations
// over `transactions` — cheap to recompute client-side at the data volumes
// a personal finance app actually has (thousands of rows, not millions).
import type { Account, AccountBalance, Project, ProjectSpend } from "@/types";
import type { LocalTransaction } from "@/lib/local-db/schema";

/** Mirrors `account_balances`: opening balance plus every transaction that
 * touches this account, either directly (`account_id`) or as a transfer's
 * destination (`to_account_id`). */
export function computeAccountBalances(
  accounts: Account[],
  transactions: Pick<LocalTransaction, "type" | "amount" | "account_id" | "to_account_id">[],
): AccountBalance[] {
  return [...accounts]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((account) => {
      let currentBalance = account.opening_balance;

      for (const t of transactions) {
        if (t.type === "income" && t.account_id === account.id) {
          currentBalance += t.amount;
        } else if (t.type === "expense" && t.account_id === account.id) {
          currentBalance -= t.amount;
        } else if (t.type === "transfer" && t.account_id === account.id) {
          currentBalance -= t.amount;
        } else if (t.type === "transfer" && t.to_account_id === account.id) {
          currentBalance += t.amount;
        }
      }

      return { ...account, current_balance: currentBalance };
    });
}

/** Mirrors `project_spend`: cumulative expense total + count of expense
 * transactions linked to each project. */
export function computeProjectSpend(
  projects: Project[],
  transactions: Pick<LocalTransaction, "type" | "amount" | "project_id">[],
): ProjectSpend[] {
  return [...projects]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((project) => {
      let spent = 0;
      let transactionCount = 0;

      for (const t of transactions) {
        if (t.type === "expense" && t.project_id === project.id) {
          spent += t.amount;
          transactionCount += 1;
        }
      }

      return { ...project, spent, transaction_count: transactionCount };
    });
}
