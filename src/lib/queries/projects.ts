import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Project, ProjectSpend } from "@/types";
import type { ProjectFormValues } from "@/lib/validations";

export async function fetchProjectSpend(
  supabase: SupabaseClient<Database>,
): Promise<ProjectSpend[]> {
  const { data, error } = await supabase
    .from("project_spend")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

function toRow(values: ProjectFormValues) {
  return {
    name: values.name,
    icon: values.icon,
    color: values.color,
    target_amount: values.targetAmount ?? null,
    start_date: values.startDate || null,
    end_date: values.endDate || null,
  };
}

export async function createProject(
  supabase: SupabaseClient<Database>,
  userId: string,
  values: ProjectFormValues,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, ...toRow(values) })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(
  supabase: SupabaseClient<Database>,
  id: string,
  values: ProjectFormValues,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(toRow(values))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setProjectArchived(
  supabase: SupabaseClient<Database>,
  id: string,
  isArchived: boolean,
): Promise<void> {
  const { error } = await supabase.from("projects").update({ is_archived: isArchived }).eq("id", id);
  if (error) throw error;
}

export async function deleteProject(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}
