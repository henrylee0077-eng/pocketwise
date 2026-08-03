"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Pencil } from "lucide-react";
import { AccountIcon } from "@/components/accounts/AccountIconPicker";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { TransactionList } from "@/components/transactions/TransactionList";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAccounts } from "@/hooks/use-accounts";
import { useAccountTransactions } from "@/hooks/use-transactions";
import { useFormatCurrency } from "@/hooks/use-currency";
import { cn, daysUntil, formatDisplayDate, nextDueDateFromDay, toAccountTypeKey } from "@/lib/utils";
import { LIABILITY_ACCOUNT_TYPES } from "@/types";

/** Due dates this close (in days, inclusive) are flagged as urgent — matches UpcomingPaymentsCard. */
const WARNING_WINDOW_DAYS = 3;

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: transactions = [], isLoading: transactionsLoading } = useAccountTransactions(id);
  const [editOpen, setEditOpen] = useState(false);

  const account = accounts.find((a) => a.id === id);

  if (accountsLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-fit rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <p className="text-sm text-muted-foreground">{t("accounts.notFound")}</p>
      </div>
    );
  }

  const isLiability = LIABILITY_ACCOUNT_TYPES.includes(account.type);
  const balance = Number(account.current_balance);
  const creditLimit = account.credit_limit != null ? Number(account.credit_limit) : null;
  const availableCredit = creditLimit != null ? Math.max(creditLimit + balance, 0) : null;

  const dueDate = account.payment_due_day != null ? nextDueDateFromDay(account.payment_due_day) : null;
  const daysLeft = dueDate ? daysUntil(dueDate) : null;
  const isUrgent = daysLeft !== null && daysLeft <= WARNING_WINDOW_DAYS;
  const daysLabel =
    daysLeft === null
      ? ""
      : daysLeft === 0
        ? t("dashboard.dueToday")
        : daysLeft === 1
          ? t("dashboard.dueTomorrow")
          : t("dashboard.dueInDays", { days: daysLeft });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">{account.name}</h1>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={t("accounts.editAccount")}
        >
          <Pencil className="size-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${account.color}22`, color: account.color }}
          >
            <AccountIcon name={account.icon} className="size-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            {account.institution ?? t(`accounts.type${toAccountTypeKey(account.type)}`)}
          </p>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">{t("accounts.currentBalance")}</p>
        <p
          className={cn(
            "text-3xl font-semibold tracking-tight",
            isLiability && balance < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {isLiability && balance < 0 ? `-${formatCurrency(Math.abs(balance))}` : formatCurrency(balance)}
        </p>

        {creditLimit != null && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("accounts.creditLimit")} {formatCurrency(creditLimit)}
            {" · "}
            {t("accounts.availableCredit")} {formatCurrency(availableCredit ?? 0)}
          </p>
        )}

        {dueDate && (
          <div
            className={cn(
              "mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
              isUrgent ? "bg-warning/10 text-warning-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {isUrgent && <AlertTriangle className="size-4 shrink-0" />}
            <span>
              {t("dashboard.dueOn", { date: formatDisplayDate(dueDate.toISOString().slice(0, 10), locale) })}
              {" · "}
              {daysLabel}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{t("accounts.transactionHistory")}</h2>
        {transactionsLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <TransactionList transactions={transactions} />
        )}
      </div>

      <AccountFormDialog open={editOpen} onOpenChange={setEditOpen} account={account} />
    </div>
  );
}
