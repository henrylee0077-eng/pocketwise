"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useGoogleAccount } from "@/hooks/use-google-backup";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDashboard } from "@/hooks/use-dashboard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RecommendedDailyBudget } from "@/components/dashboard/RecommendedDailyBudget";
import { BudgetWarningBanner } from "@/components/dashboard/BudgetWarningBanner";
import { BudgetEnforcementBanner } from "@/components/dashboard/BudgetEnforcementBanner";
import { CategoryBudgetAlerts } from "@/components/dashboard/CategoryBudgetAlerts";
import { TransactionList } from "@/components/transactions/TransactionList";
import { NetWorthSummary } from "@/components/accounts/NetWorthSummary";
import { AccountsOverviewCard } from "@/components/dashboard/AccountsOverviewCard";
import { UpcomingPaymentsCard } from "@/components/dashboard/UpcomingPaymentsCard";
import { DashboardTrendsCard } from "@/components/dashboard/DashboardTrendsCard";
import { useAccounts } from "@/hooks/use-accounts";
import { Button } from "@/components/ui/button";

function useGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 18) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

export default function DashboardPage() {
  const { data: account } = useGoogleAccount();
  const { t } = useLanguage();
  const { summary, transactions, isLoading } = useDashboard();
  const { data: accounts = [] } = useAccounts();
  const greetingKey = useGreetingKey();

  // Only a Google-connected name is ever available — nothing requires
  // signing in, so this is often empty and the greeting just omits it.
  const firstName = account?.name?.split(" ")[0] ?? "";

  if (isLoading || !summary) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t(greetingKey)}
          {firstName ? `, ${firstName}` : ""} 👋
        </h1>
      </div>

      {!summary.budget && (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t("dashboard.noBudgetSet")}</p>
          <Button asChild size="sm">
            <Link href="/budget">{t("dashboard.setBudgetCta")}</Link>
          </Button>
        </div>
      )}

      <BudgetEnforcementBanner summary={summary} />
      <BudgetWarningBanner summary={summary} />
      <CategoryBudgetAlerts summary={summary} />
      <UpcomingPaymentsCard accounts={accounts} />

      <SummaryCards summary={summary} />
      <RecommendedDailyBudget summary={summary} />
      <NetWorthSummary accounts={accounts} />
      <AccountsOverviewCard accounts={accounts} />
      <DashboardTrendsCard />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("dashboard.recentExpenses")}</h2>
          <Link
            href="/transactions"
            className="flex items-center gap-0.5 text-sm font-medium text-primary"
          >
            {t("dashboard.viewAll")}
            <ChevronRight className="size-4" />
          </Link>
        </div>
        {transactions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("dashboard.noExpensesToday")}
          </p>
        ) : (
          <TransactionList transactions={transactions.slice(0, 5)} />
        )}
      </div>
    </div>
  );
}
