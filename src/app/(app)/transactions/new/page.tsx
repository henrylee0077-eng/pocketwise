"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { QuickAddPanel } from "@/components/transactions/QuickAddPanel";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function NewTransactionPage() {
  const router = useRouter();
  const { t } = useLanguage();

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

      <QuickAddPanel onSaved={() => router.push("/transactions")} />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("quickAdd.orManual")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <TransactionForm onSuccess={() => router.push("/transactions")} onCancel={() => router.back()} />
    </div>
  );
}
