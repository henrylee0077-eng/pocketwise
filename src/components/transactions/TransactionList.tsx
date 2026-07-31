"use client";

import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { TransactionListItem } from "@/components/transactions/TransactionListItem";
import type { TransactionWithTags } from "@/types";

export function TransactionList({ transactions }: { transactions: TransactionWithTags[] }) {
  const { t } = useLanguage();
  const { data: categories = [] } = useCategories();

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t("expenses.empty")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {transactions.map((transaction) => (
        <TransactionListItem
          key={transaction.id}
          transaction={transaction}
          category={categoryMap.get(transaction.category_id)}
        />
      ))}
    </div>
  );
}
