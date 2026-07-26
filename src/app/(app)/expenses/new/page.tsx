"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function NewExpensePage() {
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
        <h1 className="text-xl font-semibold tracking-tight">{t("expenses.addExpense")}</h1>
      </div>

      <ExpenseForm onSuccess={() => router.push("/expenses")} onCancel={() => router.back()} />
    </div>
  );
}
