import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CategoryBudget } from "@/types";
import type { CategoryBudgetFormValues } from "@/lib/validations";

export async function fetchCategoryBudgetsForMonth(
  supabase: SupabaseClient<Database>,
  monthIso: string,
): Promise<CategoryBudget[]> {
  const { data, error } = await supabase
    .from("category_budgets")
    .select("*")
    .eq("month", monthIso);

  if (error) throw error;
  return data;
}

export async function upsertCategoryBudget(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthIso: string,
  values: CategoryBudgetFormValues,
): Promise<CategoryBudget> {
  const { data, error } = await supabase
    .from("category_budgets")
    .upsert(
      {
        user_id: userId,
        category_id: values.categoryId,
        month: monthIso,
        amount: values.amount,
        warning_threshold_percent: values.warningThresholdPercent,
      },
      { onConflict: "user_id,category_id,month" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategoryBudget(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("category_budgets").delete().eq("id", id);
  if (error) throw error;
}
