"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useQuickAddChat } from "@/hooks/use-quick-add-chat";
import { cn } from "@/lib/utils";

export default function AskAiPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const { turns, input, setInput, isPending, error, awaitingAnswer, send, reset } = useQuickAddChat({
    onSaved: () => router.push("/transactions"),
  });

  const suggestions = [
    t("quickAdd.suggestion1"),
    t("quickAdd.suggestion2"),
    t("quickAdd.suggestion3"),
    t("quickAdd.suggestion4"),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send();
  }

  function applySuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4.5" />
          </span>
          <h1 className="text-lg font-semibold tracking-tight">{t("nav.askAi")}</h1>
        </div>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            {t("quickAdd.startOver")}
          </button>
        )}
      </div>

      {turns.length === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("quickAdd.subtitle")}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => applySuggestion(suggestion)}
                className="rounded-full border border-border bg-secondary/60 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
          {turns.map((turn, i) => (
            <p
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                turn.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start bg-secondary/60 text-foreground",
              )}
            >
              {turn.text}
            </p>
          ))}
          {isPending && (
            <div className="flex items-center gap-2 self-start rounded-2xl bg-secondary/60 px-3.5 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              {t("common.loading")}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={awaitingAnswer ? t("quickAdd.answerPlaceholder") : t("quickAdd.placeholder")}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !input.trim()} size="icon" aria-label={t("quickAdd.parse")}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      <p className="text-center text-xs text-muted-foreground">{t("quickAdd.poweredBy")}</p>
    </div>
  );
}
