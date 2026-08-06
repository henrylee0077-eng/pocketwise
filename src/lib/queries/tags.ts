import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import type { Tag } from "@/types";
import type { TagFormValues } from "@/lib/validations";

export async function fetchTags(): Promise<Tag[]> {
  const rows = await db.tags.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTag(values: TagFormValues): Promise<Tag> {
  const row: Tag = {
    id: newId(),
    user_id: LOCAL_USER_ID,
    name: values.name,
    color: values.color,
    created_at: nowIso(),
  };
  await db.tags.add(row);
  return row;
}

/**
 * Deletes a tag and unlinks it from every transaction that had it —
 * mirrors the old `transaction_tags` join table's `on delete cascade` on
 * `tag_id` (the tag-to-transaction link is removed; the transaction
 * itself never is).
 */
export async function deleteTag(id: string): Promise<void> {
  await db.transaction("rw", db.tags, db.transactions, async () => {
    const linked = await db.transactions.where("tagIds").equals(id).toArray();
    await Promise.all(
      linked.map((t) =>
        db.transactions.update(t.id, {
          tagIds: t.tagIds.filter((tagId) => tagId !== id),
          updated_at: nowIso(),
        }),
      ),
    );
    await db.tags.delete(id);
  });
}
