import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import type { Budget } from "@/types";
import type { BudgetFormValues } from "@/lib/validations";

export async function fetchBudgetForMonth(monthIso: string): Promise<Budget | null> {
  const existing = await db.budgets.where("month").equals(monthIso).first();
  return existing ?? null;
}

export async function fetchBudgetHistory(limit = 12): Promise<Budget[]> {
  const rows = await db.budgets.toArray();
  return rows.sort((a, b) => (a.month < b.month ? 1 : -1)).slice(0, limit);
}

export async function upsertBudget(monthIso: string, values: BudgetFormValues): Promise<Budget> {
  const existing = await db.budgets.where("month").equals(monthIso).first();
  const timestamp = nowIso();

  const row: Budget = existing
    ? {
        ...existing,
        amount: values.amount,
        warning_threshold_percent: values.warningThresholdPercent,
        updated_at: timestamp,
      }
    : {
        id: newId(),
        user_id: LOCAL_USER_ID,
        month: monthIso,
        amount: values.amount,
        warning_threshold_percent: values.warningThresholdPercent,
        created_at: timestamp,
        updated_at: timestamp,
      };

  await db.budgets.put(row);
  return row;
}
