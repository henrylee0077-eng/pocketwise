"use client";

import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { TransactionListItem } from "@/components/transactions/TransactionListItem";
import type { TransactionWithTags } from "@/types";

export function TransactionList({ transactions }: { transactions: TransactionWithTags[] }) {
  const { t } = useLanguage();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

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
          category={transaction.category_id ? categoryMap.get(transaction.category_id) : undefined}
          fromAccount={transaction.account_id ? accountMap.get(transaction.account_id) : undefined}
          toAccount={transaction.to_account_id ? accountMap.get(transaction.to_account_id) : undefined}
        />
      ))}
    </div>
  );
}
