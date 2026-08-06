import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import type { Category } from "@/types";
import type { CategoryFormValues } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function fetchCategories(): Promise<Category[]> {
  const rows = await db.categories.toArray();
  return rows.sort((a, b) => a.sort_order - b.sort_order);
}

export async function createCategory(values: CategoryFormValues): Promise<Category> {
  const row: Category = {
    id: newId(),
    user_id: LOCAL_USER_ID,
    key: slugify(values.nameEn),
    name_en: values.nameEn,
    name_zh: values.nameZh,
    icon: values.icon,
    color: values.color,
    is_essential: values.isEssential,
    is_system: false,
    type: values.type,
    sort_order: 100,
    created_at: nowIso(),
  };
  await db.categories.add(row);
  return row;
}

export async function updateCategory(id: string, values: CategoryFormValues): Promise<Category> {
  const existing = await db.categories.get(id);
  if (!existing) throw new Error("Category not found");
  const updated: Category = {
    ...existing,
    name_en: values.nameEn,
    name_zh: values.nameZh,
    icon: values.icon,
    color: values.color,
    is_essential: values.isEssential,
    type: values.type,
  };
  await db.categories.put(updated);
  return updated;
}

/**
 * Deletes a category. Mirrors the old `on delete restrict` foreign key —
 * a category that's actually in use (by a transaction or a recurring
 * rule) can't be deleted, since every transaction/rule that isn't a
 * transfer requires a category. Throws rather than silently leaving
 * transactions pointing at a category that no longer exists. Any
 * per-category budgets for it are cascade-deleted along with it, same as
 * the original `category_budgets.category_id` foreign key.
 */
export async function deleteCategory(id: string): Promise<void> {
  const [transactionCount, recurringCount] = await Promise.all([
    db.transactions.where("category_id").equals(id).count(),
    db.recurringTransactions.filter((r) => r.category_id === id).count(),
  ]);
  if (transactionCount > 0 || recurringCount > 0) {
    throw new Error("This category is used by existing transactions and can't be deleted.");
  }

  await db.transaction("rw", db.categories, db.categoryBudgets, async () => {
    await db.categoryBudgets.where("category_id").equals(id).delete();
    await db.categories.delete(id);
  });
}
