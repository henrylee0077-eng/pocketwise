import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Category } from "@/types";
import type { CategoryFormValues } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function fetchCategories(
  supabase: SupabaseClient<Database>,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  values: CategoryFormValues,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      key: slugify(values.nameEn),
      name_en: values.nameEn,
      name_zh: values.nameZh,
      icon: values.icon,
      color: values.color,
      is_essential: values.isEssential,
      is_system: false,
      type: values.type,
      sort_order: 100,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  supabase: SupabaseClient<Database>,
  id: string,
  values: CategoryFormValues,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name_en: values.nameEn,
      name_zh: values.nameZh,
      icon: values.icon,
      color: values.color,
      is_essential: values.isEssential,
      type: values.type,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
