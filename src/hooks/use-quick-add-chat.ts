"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCreateTransaction, useDeleteTransaction } from "@/hooks/use-transactions";
import { useCategories, useCreateCategory } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { usePaymentMethods, useCreatePaymentMethod } from "@/hooks/use-payment-methods";
import { usePreferredCurrency } from "@/hooks/use-currency";
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
  newCategoryName: string;
  accountId: string;
  toAccountId: string;
  paymentMethodId: string;
  newPaymentMethodName: string;
  merchant: string;
  note: string;
  priority: string;
}

type ParseResponse =
  | { status: "needs_clarification"; question: string }
  | { status: "ready"; draft: QuickAddDraft }
  | { error: string };

/**
 * Drives the conversational quick-add flow: holds the turn history, sends
 * each new message to /api/quick-add/parse (along with the current local
 * categories/accounts/payment methods, since that route has no database of
 * its own — see its file header), and auto-saves the transaction the
 * moment the model reports it has every required field.
 *
 * If the model named a category or payment method that doesn't exist yet,
 * the server route can't create it (no database access), so it comes back
 * as `newCategoryName`/`newPaymentMethodName` instead of an id — this hook
 * creates it locally before saving, same escape hatch as before just moved
 * to the side that actually owns the data now.
 */
export function useQuickAddChat({ onSaved }: { onSaved?: () => void } = {}) {
  const { t } = useLanguage();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const currency = usePreferredCurrency();
  const createCategory = useCreateCategory();
  const createPaymentMethod = useCreatePaymentMethod();

  const [turns, setTurns] = useState<QuickAddTurn[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const awaitingAnswer = turns.length > 0 && turns[turns.length - 1]?.role === "model";

  async function resolveDraft(draft: QuickAddDraft): Promise<TransactionFormValues> {
    let categoryId = draft.categoryId;
    let paymentMethodId = draft.paymentMethodId;

    if (!categoryId && draft.newCategoryName && draft.type !== "transfer") {
      const created = await createCategory.mutateAsync({
        type: draft.type,
        nameEn: draft.newCategoryName,
        nameZh: draft.newCategoryName,
        icon: "Tag",
        color: "#6B7280",
        isEssential: true,
      });
      categoryId = created.id;
    }

    if (!paymentMethodId && draft.newPaymentMethodName && draft.type !== "transfer") {
      const created = await createPaymentMethod.mutateAsync({
        nameEn: draft.newPaymentMethodName,
        nameZh: draft.newPaymentMethodName,
        icon: "Smartphone",
      });
      paymentMethodId = created.id;
    }

    return {
      type: draft.type,
      amount: draft.amount,
      date: draft.date,
      categoryId,
      accountId: draft.accountId,
      toAccountId: draft.toAccountId,
      paymentMethodId,
      merchant: draft.merchant,
      note: draft.note,
      priority: (draft.priority || undefined) as TransactionFormValues["priority"],
      tagIds: [],
    };
  }

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
        body: JSON.stringify({
          turns: nextTurns,
          categories: categories.map((c) => ({
            id: c.id,
            key: c.key,
            name_en: c.name_en,
            name_zh: c.name_zh,
            type: c.type,
          })),
          accounts: accounts.map((a) => ({
            id: a.id,
            name: a.name,
            institution: a.institution,
            type: a.type,
            is_archived: a.is_archived,
          })),
          paymentMethods: paymentMethods.map((p) => ({
            id: p.id,
            key: p.key,
            name_en: p.name_en,
            name_zh: p.name_zh,
          })),
          currency,
        }),
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

      const values = await resolveDraft(body.draft);
      const created = await createTransaction.mutateAsync(values);
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
