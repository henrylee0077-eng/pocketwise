"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDeleteTag, useTags } from "@/hooks/use-tags";

export default function TagsSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: tags = [] } = useTags();
  const deleteTag = useDeleteTag();

  async function handleDelete(id: string) {
    try {
      await deleteTag.mutateAsync(id);
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">{t("transactions.tags")}</h1>
      </div>

      {tags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("transactions.noTags")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <p className="flex-1 truncate text-sm font-medium">#{tag.name}</p>
              <button
                type="button"
                onClick={() => handleDelete(tag.id)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("transactions.tagsHint")}</p>
    </div>
  );
}
