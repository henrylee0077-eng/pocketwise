"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCreateTag, useTags } from "@/hooks/use-tags";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tagIds: string[]) => void;
}) {
  const { t } = useLanguage();
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const [adding, setAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  function toggle(tagId: string) {
    onChange(value.includes(tagId) ? value.filter((id) => id !== tagId) : [...value, tagId]);
  }

  async function handleCreate() {
    const name = newTagName.trim();
    if (!name) return;
    try {
      const tag = await createTag.mutateAsync({ name, color: "#6B7280" });
      onChange([...value, tag.id]);
      setNewTagName("");
      setAdding(false);
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => {
        const selected = value.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {selected && <X className="size-3" />}#{tag.name}
          </button>
        );
      })}

      {adding ? (
        <div className="flex items-center gap-1.5">
          <Input
            autoFocus
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder={t("transactions.newTagPlaceholder")}
            className="h-8 w-32 rounded-full px-3 text-xs"
          />
          <Button type="button" size="sm" className="h-8" onClick={handleCreate}>
            {t("transactions.addTag")}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Plus className="size-3" />
          {t("transactions.addTag")}
        </button>
      )}
    </div>
  );
}
