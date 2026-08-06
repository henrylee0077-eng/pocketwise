import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import type { CategoryBudget } from "@/types";
import type { CategoryBudgetFormValues } from "@/lib/validations";

export async function fetchCategoryBudgetsForMonth(monthIso: string): Promise<CategoryBudget[]> {
  return db.categoryBudgets.where("month").equals(monthIso).toArray();
}

export async function upsertCategoryBudget(
  monthIso: string,
  values: CategoryBudgetFormValues,
): Promise<CategoryBudget> {
  const existing = await db.categoryBudgets
    .where("[category_id+month]")
    .equals([values.categoryId, monthIso])
    .first();
  const timestamp = nowIso();

  const row: CategoryBudget = existing
    ? {
        ...existing,
        amount: values.amount,
        warning_threshold_percent: values.warningThresholdPercent,
        updated_at: timestamp,
      }
    : {
        id: newId(),
        user_id: LOCAL_USER_ID,
        category_id: values.categoryId,
        month: monthIso,
        amount: values.amount,
        warning_threshold_percent: values.warningThresholdPercent,
        created_at: timestamp,
        updated_at: timestamp,
      };

  await db.categoryBudgets.put(row);
  return row;
}

export async function deleteCategoryBudget(id: string): Promise<void> {
  await db.categoryBudgets.delete(id);
}
