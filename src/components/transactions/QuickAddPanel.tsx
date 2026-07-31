"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TransactionFormInput } from "@/lib/validations";

export function QuickAddPanel({
  onParsed,
}: {
  onParsed: (draft: Partial<TransactionFormInput>) => void;
}) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isPending) return;

    setIsPending(true);
    setError(null);
    try {
      const res = await fetch("/api/quick-add/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? t("quickAdd.error"));
        return;
      }
      onParsed(body.draft);
      setText("");
    } catch {
      setError(t("quickAdd.error"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="size-4 text-primary" />
        {t("quickAdd.title")}
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("quickAdd.placeholder")}
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !text.trim()} size="icon" aria-label={t("quickAdd.parse")}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">{t("quickAdd.hint")}</p>
    </form>
  );
}
