"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCreateTransaction, useDeleteTransaction } from "@/hooks/use-transactions";
import type { TransactionFormValues } from "@/lib/validations";

interface Turn {
  role: "user" | "model";
  text: string;
}

interface QuickAddDraft {
  type: "expense" | "income" | "transfer";
  amount: number;
  date: string;
  categoryId: string;
  accountId: string;
  toAccountId: string;
  paymentMethodId: string;
  merchant: string;
  note: string;
  priority: string;
}

type ParseResponse =
  | { status: "needs_clarification"; question: string }
  | { status: "ready"; draft: QuickAddDraft }
  | { error: string };

function draftToValues(draft: QuickAddDraft): TransactionFormValues {
  return {
    type: draft.type,
    amount: draft.amount,
    date: draft.date,
    categoryId: draft.categoryId,
    accountId: draft.accountId,
    toAccountId: draft.toAccountId,
    paymentMethodId: draft.paymentMethodId,
    merchant: draft.merchant,
    note: draft.note,
    priority: (draft.priority || undefined) as TransactionFormValues["priority"],
    tagIds: [],
  };
}

export function QuickAddPanel({ onSaved }: { onSaved?: () => void }) {
  const { t } = useLanguage();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const awaitingAnswer = turns.length > 0 && turns[turns.length - 1]?.role === "model";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    const nextTurns: Turn[] = [...turns, { role: "user", text }];
    setTurns(nextTurns);
    setInput("");
    setIsPending(true);
    setError(null);

    try {
      const res = await fetch("/api/quick-add/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turns: nextTurns }),
      });
      const body: ParseResponse = await res.json();

      if (!res.ok || "error" in body) {
        setError("error" in body ? body.error : t("quickAdd.error"));
        return;
      }

      if (body.status === "needs_clarification") {
        setTurns([...nextTurns, { role: "model", text: body.question }]);
        return;
      }

      const created = await createTransaction.mutateAsync(draftToValues(body.draft));
      toast.success(t("quickAdd.savedToast"), {
        action: {
          label: t("quickAdd.undo"),
          onClick: async () => {
            try {
              await deleteTransaction.mutateAsync(created.id);
              toast.success(t("quickAdd.undoneToast"));
            } catch {
              toast.error(t("common.error"));
            }
          },
        },
      });
      setTurns([]);
      onSaved?.();
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
