import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Budget } from "@/types";
import type { BudgetFormValues } from "@/lib/validations";

export async function fetchBudgetForMonth(
  supabase: SupabaseClient<Database>,
  monthIso: string,
): Promise<Budget | null> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("month", monthIso)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchBudgetHistory(
  supabase: SupabaseClient<Database>,
  limit = 12,
): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .order("month", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function upsertBudget(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthIso: string,
  values: BudgetFormValues,
): Promise<Budget> {
  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: userId,
        month: monthIso,
        amount: values.amount,
        warning_threshold_percent: values.warningThresholdPercent,
      },
      { onConflict: "user_id,month" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
