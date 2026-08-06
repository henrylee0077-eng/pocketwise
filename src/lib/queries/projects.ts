import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import { computeProjectSpend } from "@/lib/local-db/derived";
import type { Project, ProjectSpend } from "@/types";
import type { ProjectFormValues } from "@/lib/validations";

export async function fetchProjectSpend(): Promise<ProjectSpend[]> {
  const [projects, transactions] = await Promise.all([
    db.projects.toArray(),
    db.transactions.toArray(),
  ]);
  return computeProjectSpend(projects, transactions);
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

export async function createProject(values: ProjectFormValues): Promise<Project> {
  const timestamp = nowIso();
  const count = await db.projects.count();
  const row: Project = {
    id: newId(),
    user_id: LOCAL_USER_ID,
    is_archived: false,
    sort_order: count,
    created_at: timestamp,
    updated_at: timestamp,
    ...toRow(values),
  };
  await db.projects.add(row);
  return row;
}

export async function updateProject(id: string, values: ProjectFormValues): Promise<Project> {
  const existing = await db.projects.get(id);
  if (!existing) throw new Error("Project not found");
  const updated: Project = { ...existing, ...toRow(values), updated_at: nowIso() };
  await db.projects.put(updated);
  return updated;
}

export async function setProjectArchived(id: string, isArchived: boolean): Promise<void> {
  await db.projects.update(id, { is_archived: isArchived, updated_at: nowIso() });
}

/**
 * Deletes a project. Transactions that were linked to it are unlinked
 * (project_id -> null) rather than deleted, mirroring the old Postgres FK's
 * `on delete set null` behavior.
 */
export async function deleteProject(id: string): Promise<void> {
  await db.transaction("rw", db.projects, db.transactions, async () => {
    const linked = await db.transactions.where("project_id").equals(id).toArray();
    await Promise.all(
      linked.map((t) => db.transactions.update(t.id, { project_id: null, updated_at: nowIso() })),
    );
    await db.projects.delete(id);
  });
}
