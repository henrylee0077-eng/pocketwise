"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";

export default function ExpensesPage() {
  const { t, locale } = useLanguage();
  const { expenses, summary, isLoading } = useDashboard();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("expenses.title")}</h1>
          <p className="text-sm text-muted-foreground">{formatMonthLabel(new Date(), locale)}</p>
        </div>
        <Button asChild size="lg">
          <Link href="/expenses/new">
            <Plus className="size-4" />
            {t("expenses.addExpense")}
          </Link>
        </Button>
      </div>

      {summary && (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">{t("expenses.thisMonth")}</span>
          <span className="text-base font-semibold">{formatCurrency(summary.monthTotal)}</span>
        </div>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <ExpenseList expenses={expenses} />
      )}
    </div>
  );
}
