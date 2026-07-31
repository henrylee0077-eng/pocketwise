"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useQuickAddChat } from "@/hooks/use-quick-add-chat";

export function QuickAddPanel({ onSaved }: { onSaved?: () => void }) {
  const { t } = useLanguage();
  const { turns, input, setInput, isPending, error, awaitingAnswer, send } = useQuickAddChat({ onSaved });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="size-4 text-primary" />
        {t("quickAdd.title")}
      </div>

      {turns.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-secondary/50 p-3">
          {turns.map((turn, i) => (
            <p
              key={i}
              className={
                turn.role === "user"
                  ? "self-end rounded-2xl bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                  : "self-start max-w-[90%] rounded-2xl bg-card px-3 py-1.5 text-sm text-foreground shadow-sm"
              }
            >
              {turn.text}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={awaitingAnswer ? t("quickAdd.answerPlaceholder") : t("quickAdd.placeholder")}
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !input.trim()} size="icon" aria-label={t("quickAdd.parse")}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">{t("quickAdd.hint")}</p>
    </form>
  );
}
