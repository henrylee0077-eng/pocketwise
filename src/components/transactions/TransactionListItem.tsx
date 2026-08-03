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
import { CategoryIcon, categoryName } from "@/components/transactions/CategoryPicker";
import { AccountIcon } from "@/components/accounts/AccountIconPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDeleteTransaction } from "@/hooks/use-transactions";
import { useFormatCurrency } from "@/hooks/use-currency";
import { cn, formatDisplayDate } from "@/lib/utils";
import type { Account, Category, TransactionWithTags } from "@/types";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-muted-foreground",
};

export function TransactionListItem({
  transaction,
  category,
  fromAccount,
  toAccount,
}: {
  transaction: TransactionWithTags;
  category: Category | undefined;
  fromAccount?: Account;
  toAccount?: Account;
}) {
  const { locale, t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const deleteTransaction = useDeleteTransaction();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteTransaction.mutateAsync(transaction.id);
      toast.success(t("expenses.toastDeleted"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setOpen(false);
    }
  }

  const subtitleParts = [
    formatDisplayDate(transaction.expense_date, locale),
    transaction.merchant,
    transaction.note,
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
      <span
        className="relative flex size-11 shrink-0 items-center justify-center rounded-full"
        style={
          transaction.type === "transfer"
            ? { backgroundColor: "#6B728022", color: "#6B7280" }
            : { backgroundColor: `${category?.color ?? "#6B7280"}22`, color: category?.color ?? "#6B7280" }
        }
      >
        {transaction.type === "transfer" ? (
          <AccountIcon name="ArrowLeftRight" className="size-5" />
        ) : (
          <CategoryIcon name={category?.icon ?? "MoreHorizontal"} className="size-5" />
        )}
        {transaction.priority && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-card",
              PRIORITY_DOT[transaction.priority],
            )}
          />
        )}
      </span>

      <Link href={`/transactions/${transaction.id}/edit`} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {transaction.type === "transfer"
            ? `${fromAccount?.name ?? "?"} → ${toAccount?.name ?? "?"}`
            : category
              ? categoryName(category, locale)
              : "—"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{subtitleParts.join(" · ")}</p>
      </Link>

      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          transaction.type === "income" ? "text-primary" : "text-foreground",
        )}
      >
        {transaction.type === "income" ? "+" : ""}
        {formatCurrency(Number(transaction.amount))}
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
