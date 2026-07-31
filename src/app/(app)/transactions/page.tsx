"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionFilterBar } from "@/components/transactions/TransactionFilterBar";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useMonthTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatMonthLabel, monthKey } from "@/lib/utils";
import { useState } from "react";
import type { TransactionFilters } from "@/types";

export default function TransactionsPage() {
  const { t, locale } = useLanguage();
  const [filters, setFilters] = useState<TransactionFilters>({});
  const currentMonthIso = monthKey();
  const { data: transactions, isLoading } = useMonthTransactions(currentMonthIso, filters);

  const monthExpenseTotal = (transactions ?? [])
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const monthIncomeTotal = (transactions ?? [])
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("expenses.title")}</h1>
          <p className="text-sm text-muted-foreground">{formatMonthLabel(new Date(), locale)}</p>
        </div>
        <Button asChild size="lg">
          <Link href="/transactions/new">
            <Plus className="size-4" />
            {t("nav.addExpense")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("dashboard.monthSpending")}</p>
          <p className="text-base font-semibold">{formatCurrency(monthExpenseTotal)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("transactions.monthIncome")}</p>
          <p className="text-base font-semibold text-primary">{formatCurrency(monthIncomeTotal)}</p>
        </div>
      </div>

      <TransactionFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <TransactionList transactions={transactions ?? []} />
      )}
    </div>
  );
}
