"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useQuickAddChat } from "@/hooks/use-quick-add-chat";
import { cn } from "@/lib/utils";

export default function AskAiPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const { turns, input, setInput, isPending, error, awaitingAnswer, send } = useQuickAddChat({
    onSaved: () => router.push("/transactions"),
  });

  const suggestions = [t("quickAdd.suggestion1"), t("quickAdd.suggestion2"), t("quickAdd.suggestion3"), t("quickAdd.suggestion4")];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send();
  }

  function applySuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-indigo-950 text-white">
      {/* Ambient glow blobs, purely decorative */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-teal-500/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 size-72 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 size-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("quickAdd.close")}
          className="flex size-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4" />
          {t("nav.askAi")}
          <span className="rounded-full border border-white/25 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-white/70">
            {t("quickAdd.beta")}
          </span>
        </div>
        <div className="size-9" />
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 flex-col justify-end overflow-y-auto px-4 pb-4">
        {turns.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <p className="font-serif text-3xl font-medium text-white/95">{t("quickAdd.greeting")}</p>
            <div className="flex max-w-md flex-wrap items-center justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm text-white/90 backdrop-blur transition-colors hover:bg-white/20"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-end gap-2 py-4">
            {turns.map((turn, i) => (
              <p
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  turn.role === "user"
                    ? "self-end bg-white text-slate-900"
                    : "self-start border border-white/15 bg-white/10 text-white backdrop-blur",
                )}
              >
                {turn.text}
              </p>
            ))}
            {isPending && (
              <div className="flex items-center gap-2 self-start rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white/70 backdrop-blur">
                <Loader2 className="size-3.5 animate-spin" />
                {t("common.loading")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="relative z-10 mx-auto w-full max-w-lg px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {error && <p className="mb-2 text-center text-sm text-rose-300">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 p-1.5 pl-4 backdrop-blur-md"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={awaitingAnswer ? t("quickAdd.answerPlaceholder") : t("nav.askAi")}
            disabled={isPending}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            aria-label={t("quickAdd.parse")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-900 transition-opacity disabled:opacity-40"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
        <p className="mt-3 text-center text-[11px] text-white/40">{t("quickAdd.poweredBy")}</p>
      </div>
    </div>
  );
}
