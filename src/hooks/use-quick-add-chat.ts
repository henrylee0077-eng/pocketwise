"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCreateTransaction, useDeleteTransaction } from "@/hooks/use-transactions";
import type { TransactionFormValues } from "@/lib/validations";

export interface QuickAddTurn {
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

/**
 * Drives the conversational quick-add flow: holds the turn history, sends
 * each new message to /api/quick-add/parse, and auto-saves the transaction
 * the moment the model reports it has every required field. Shared by the
 * compact inline panel and the full-screen "Ask AI" experience so the two
 * surfaces can never drift out of sync.
 */
export function useQuickAddChat({ onSaved }: { onSaved?: () => void } = {}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [turns, setTurns] = useState<QuickAddTurn[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const awaitingAnswer = turns.length > 0 && turns[turns.length - 1]?.role === "model";

  async function send(rawText?: string) {
    const text = (rawText ?? input).trim();
    if (!text || isPending) return;

    const nextTurns: QuickAddTurn[] = [...turns, { role: "user", text }];
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
      // Quick-add may have auto-created a brand new category or payment
      // method server-side (when nothing existing matched) — refresh so
      // pickers elsewhere pick it up without a manual reload.
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
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

  function reset() {
    setTurns([]);
    setInput("");
    setError(null);
  }

  return { turns, input, setInput, isPending, error, awaitingAnswer, send, reset };
}
