import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Tag } from "@/types";
import type { TagFormValues } from "@/lib/validations";

export async function fetchTags(supabase: SupabaseClient<Database>): Promise<Tag[]> {
  const { data, error } = await supabase.from("tags").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTag(
  supabase: SupabaseClient<Database>,
  userId: string,
  values: TagFormValues,
): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .insert({ user_id: userId, name: values.name, color: values.color })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}
