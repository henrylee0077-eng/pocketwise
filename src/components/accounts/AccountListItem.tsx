"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
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
import { AccountIcon } from "@/components/accounts/AccountIconPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDeleteAccount, useSetAccountArchived } from "@/hooks/use-accounts";
import { useFormatCurrency } from "@/hooks/use-currency";
import { toAccountTypeKey } from "@/lib/utils";
import { LIABILITY_ACCOUNT_TYPES, type AccountBalance } from "@/types";

export function AccountListItem({
  account,
  onEdit,
}: {
  account: AccountBalance;
  onEdit: () => void;
}) {
  const { t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const deleteAccount = useDeleteAccount();
  const setArchived = useSetAccountArchived();
  const [open, setOpen] = useState(false);

  const isLiability = LIABILITY_ACCOUNT_TYPES.includes(account.type);
  const balance = Number(account.current_balance);

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync(account.id);
      toast.success(t("accounts.deleted"));
    } catch {
      toast.error(t("accounts.deleteError"));
    } finally {
      setOpen(false);
    }
  }

  async function handleToggleArchive() {
    try {
      await setArchived.mutateAsync({ id: account.id, isArchived: !account.is_archived });
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${account.color}22`, color: account.color }}
      >
        <AccountIcon name={account.icon} className="size-5" />
      </span>

      <Link href={`/settings/accounts/${account.id}`} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {account.institution ?? t(`accounts.type${toAccountTypeKey(account.type)}`)}
        </p>
      </Link>

      <span
        className={`shrink-0 text-sm font-semibold ${
          isLiability && balance < 0 ? "text-destructive" : "text-foreground"
        }`}
      >
        {isLiability
          ? balance < 0
            ? `-${formatCurrency(Math.abs(balance))}`
            : formatCurrency(balance)
          : formatCurrency(balance)}
      </span>

      <button
        type="button"
        onClick={handleToggleArchive}
        className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label={account.is_archived ? t("accounts.unarchive") : t("accounts.archive")}
      >
        {account.is_archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label={t("accounts.editAccount")}
      >
        <Pencil className="size-4" />
      </button>

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
            <AlertDialogTitle>{t("accounts.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("accounts.deleteConfirmBody")}</AlertDialogDescription>
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
