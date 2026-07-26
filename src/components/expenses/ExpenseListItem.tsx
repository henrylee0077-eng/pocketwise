"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CategoryIcon, categoryName } from "@/components/expenses/CategoryPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDeleteExpense } from "@/hooks/use-expenses";
import { formatCurrency, formatDisplayDate } from "@/lib/utils";
import type { Category, Expense } from "@/types";

export function ExpenseListItem({
  expense,
  category,
}: {
  expense: Expense;
  category: Category | undefined;
}) {
  const { locale, t } = useLanguage();
  const deleteExpense = useDeleteExpense();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteExpense.mutateAsync(expense.id);
      toast.success(t("expenses.toastDeleted"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${category?.color ?? "#6B7280"}22`,
          color: category?.color ?? "#6B7280",
        }}
      >
        <CategoryIcon name={category?.icon ?? "MoreHorizontal"} className="size-5" />
      </span>

      <Link href={`/expenses/${expense.id}/edit`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {category ? categoryName(category, locale) : "—"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatDisplayDate(expense.expense_date, locale)}
          {expense.note ? ` · ${expense.note}` : ""}
        </p>
      </Link>

      <span className="shrink-0 text-sm font-semibold text-foreground">
        {formatCurrency(Number(expense.amount))}
      </span>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
            aria-label={t("expenses.delete")}
          >
            <Trash2 className="size-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("expenses.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("expenses.deleteConfirmBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("expenses.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("expenses.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
