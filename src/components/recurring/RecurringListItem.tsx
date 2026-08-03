"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { CategoryIcon, categoryName } from "@/components/transactions/CategoryPicker";
import { AccountIcon } from "@/components/accounts/AccountIconPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import {
  useDeleteRecurringTransaction,
  useSetRecurringTransactionActive,
} from "@/hooks/use-recurring-transactions";
import { formatDisplayDate } from "@/lib/utils";
import { useFormatCurrency } from "@/hooks/use-currency";
import type { RecurringTransaction } from "@/types";

export function RecurringListItem({
  rule,
  onEdit,
}: {
  rule: RecurringTransaction;
  onEdit: () => void;
}) {
  const { locale, t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const deleteRule = useDeleteRecurringTransaction();
  const setActive = useSetRecurringTransactionActive();
  const [open, setOpen] = useState(false);

  const category = categories.find((c) => c.id === rule.category_id);
  const fromAccount = accounts.find((a) => a.id === rule.account_id);
  const toAccount = accounts.find((a) => a.id === rule.to_account_id);

  const title =
    rule.type === "transfer"
      ? `${fromAccount?.name ?? "?"} → ${toAccount?.name ?? "?"}`
      : category
        ? categoryName(category, locale)
        : "—";

  async function handleDelete() {
    try {
      await deleteRule.mutateAsync(rule.id);
      toast.success(t("recurring.deleted"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        {rule.type === "transfer" ? (
          <AccountIcon name="Repeat" className="size-5" />
        ) : category ? (
          <CategoryIcon name={category.icon} className="size-5" />
        ) : (
          <AccountIcon name="Repeat" className="size-5" />
        )}
      </span>

      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {t(`recurring.frequency${rule.frequency.charAt(0).toUpperCase()}${rule.frequency.slice(1)}`)}
          {" · "}
          {t("recurring.nextRun")} {formatDisplayDate(rule.next_run_date, locale)}
        </p>
      </button>

      <span className="shrink-0 text-sm font-semibold text-foreground">
        {formatCurrency(Number(rule.amount))}
      </span>

      <Switch
        checked={rule.is_active}
        onCheckedChange={(v) => setActive.mutate({ id: rule.id, isActive: v })}
      />

      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Pencil className="size-4" />
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("recurring.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("recurring.deleteConfirmBody")}</AlertDialogDescription>
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
