"use client";

import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { ExpenseListItem } from "@/components/expenses/ExpenseListItem";
import type { Expense } from "@/types";

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const { t } = useLanguage();
  const { data: categories = [] } = useCategories();

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t("expenses.empty")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {expenses.map((expense) => (
        <ExpenseListItem
          key={expense.id}
          expense={expense}
          category={categoryMap.get(expense.category_id)}
        />
      ))}
    </div>
  );
}
