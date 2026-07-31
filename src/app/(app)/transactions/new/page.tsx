"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { QuickAddPanel } from "@/components/transactions/QuickAddPanel";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TransactionFormInput } from "@/lib/validations";

export default function NewTransactionPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [draft, setDraft] = useState<Partial<TransactionFormInput> | undefined>(undefined);
  const [draftVersion, setDraftVersion] = useState(0);

  function handleParsed(next: Partial<TransactionFormInput>) {
    setDraft(next);
    setDraftVersion((v) => v + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
          aria-label={t("expenses.cancel")}
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">{t("nav.addExpense")}</h1>
      </div>

      <QuickAddPanel onParsed={handleParsed} />

      {draft && <p className="-mt-2 text-xs text-muted-foreground">{t("quickAdd.reviewHint")}</p>}

      <TransactionForm
        key={draftVersion}
        initialValues={draft}
        onSuccess={() => router.push("/transactions")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
