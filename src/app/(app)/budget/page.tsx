"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { CategoryBudgetSection } from "@/components/budget/CategoryBudgetSection";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDashboard } from "@/hooks/use-dashboard";
import { useBudgetHistory } from "@/hooks/use-budget";
import { formatMonthLabel, monthKey } from "@/lib/utils";
import { useFormatCurrency } from "@/hooks/use-currency";

export default function BudgetPage() {
  const { t, locale } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const { summary, isLoading } = useDashboard();
  const { data: history = [] } = useBudgetHistory();
  const currentMonthIso = monthKey();

  const pastBudgets = history.filter((b) => b.month !== currentMonthIso);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("budget.title")}</h1>

      {!isLoading && summary?.budget && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("budget.currentMonth")} · {formatMonthLabel(new Date(), locale)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Progress
              value={Math.min(summary.usagePercent ?? 0, 100)}
              indicatorClassName={
                summary.budgetExhausted
                  ? "bg-destructive"
                  : summary.warningTriggered
                    ? "bg-warning"
                    : undefined
              }
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatCurrency(summary.monthExpenseTotal)} /{" "}
                {formatCurrency(Number(summary.budget.amount))}
              </span>
              <span
                className={
                  (summary.remainingBudget ?? 0) < 0
                    ? "font-semibold text-destructive"
                    : "font-semibold text-foreground"
                }
              >
                {formatCurrency(summary.remainingBudget ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("budget.monthlyAmount")}</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm monthIso={currentMonthIso} budget={summary?.budget ?? null} />
        </CardContent>
      </Card>

      {summary && (
        <CategoryBudgetSection monthIso={currentMonthIso} statuses={summary.categoryBudgets} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("budget.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {pastBudgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("budget.noHistory")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pastBudgets.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatMonthLabel(new Date(`${b.month}T00:00:00`), locale)}
                  </span>
                  <span className="font-medium">{formatCurrency(Number(b.amount))}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
