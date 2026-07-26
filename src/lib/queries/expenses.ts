import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Expense } from "@/types";
import type { ExpenseFormValues } from "@/lib/validations";

export interface MonthRange {
  /** Inclusive, ISO yyyy-MM-dd */
  start: string;
  /** Inclusive, ISO yyyy-MM-dd */
  end: string;
}

export async function fetchExpensesForRange(
  supabase: SupabaseClient<Database>,
  range: MonthRange,
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("expense_date", range.start)
    .lte("expense_date", range.end)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createExpense(
  supabase: SupabaseClient<Database>,
  userId: string,
  values: ExpenseFormValues,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      category_id: values.categoryId,
      amount: values.amount,
      expense_date: values.expenseDate,
      note: values.note || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateExpense(
  supabase: SupabaseClient<Database>,
  id: string,
  values: ExpenseFormValues,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .update({
      category_id: values.categoryId,
      amount: values.amount,
      expense_date: values.expenseDate,
      note: values.note || null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExpense(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
