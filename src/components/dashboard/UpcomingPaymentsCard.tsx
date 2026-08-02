"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountIcon } from "@/components/accounts/AccountIconPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn, daysUntil, formatDisplayDate, nextDueDateFromDay } from "@/lib/utils";
import { LIABILITY_ACCOUNT_TYPES, type AccountBalance } from "@/types";

/** Due dates this close (in days, inclusive) are flagged as urgent. */
const WARNING_WINDOW_DAYS = 3;

interface UpcomingPayment {
  account: AccountBalance;
  dueDate: Date;
  daysLeft: number;
}

function buildUpcomingPayments(accounts: AccountBalance[]): UpcomingPayment[] {
  return accounts
    .filter(
      (a) =>
        !a.is_archived &&
        LIABILITY_ACCOUNT_TYPES.includes(a.type) &&
        a.payment_due_day != null,
    )
    .map((account) => {
      const dueDate = nextDueDateFromDay(account.payment_due_day!);
      return { account, dueDate, daysLeft: daysUntil(dueDate) };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function UpcomingPaymentsCard({ accounts }: { accounts: AccountBalance[] }) {
  const { t, locale } = useLanguage();
  const payments = buildUpcomingPayments(accounts);

  if (payments.length === 0) return null;

  return (
    <Card>
      <CardHeader className="space-y-0">
        <CardTitle>{t("dashboard.upcomingPayments")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-0">
        {payments.map(({ account, dueDate, daysLeft }) => {
          const isUrgent = daysLeft <= WARNING_WINDOW_DAYS;
          const daysLabel =
            daysLeft === 0
              ? t("dashboard.dueToday")
              : daysLeft === 1
                ? t("dashboard.dueTomorrow")
                : t("dashboard.dueInDays", { days: daysLeft });

          return (
            <div
              key={account.id}
              className={cn(
                "flex items-center gap-3 px-5 py-3",
                isUrgent && "bg-warning/10",
              )}
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${account.color}22`, color: account.color }}
              >
                <AccountIcon name={account.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{account.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t("dashboard.dueOn", { date: formatDisplayDate(dueDate.toISOString().slice(0, 10), locale) })}
                </span>
              </span>
              <Badge variant={isUrgent ? "warning" : "outline"} className="shrink-0">
                {isUrgent && <AlertTriangle className="size-3" />}
                {daysLabel}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
