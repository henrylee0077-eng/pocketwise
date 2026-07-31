"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDashboard } from "@/hooks/use-dashboard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RecommendedDailyBudget } from "@/components/dashboard/RecommendedDailyBudget";
import { BudgetWarningBanner } from "@/components/dashboard/BudgetWarningBanner";
import { BudgetEnforcementBanner } from "@/components/dashboard/BudgetEnforcementBanner";
import { CategoryBudgetAlerts } from "@/components/dashboard/CategoryBudgetAlerts";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Button } from "@/components/ui/button";

function useGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 18) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { summary, transactions, isLoading } = useDashboard();
  const greetingKey = useGreetingKey();

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";

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

      <SummaryCards summary={summary} />
      <RecommendedDailyBudget summary={summary} />

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
