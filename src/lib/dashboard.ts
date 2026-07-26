import type { Budget, Category, DashboardSummary, Expense } from "@/types";
import { getMonthProgress, monthKey, todayIso } from "@/lib/utils";

/**
 * Pure computation of the dashboard numbers from raw data. Kept separate
 * from data-fetching so the budget math (today's total, remaining budget,
 * recommended daily spend, warning/enforcement thresholds) can be unit
 * tested and reasoned about without touching Supabase or React.
 */
export function computeDashboardSummary(
  monthExpenses: Expense[],
  budget: Budget | null,
  now: Date = new Date(),
): DashboardSummary {
  const today = todayIso();
  const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const todayTotal = monthExpenses
    .filter((e) => e.expense_date === today)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const { totalDaysInMonth, daysRemainingIncludingToday } = getMonthProgress(now);

  const remainingBudget = budget ? Number(budget.amount) - monthTotal : null;

  const recommendedDailyBudget =
    budget && remainingBudget !== null
      ? Math.max(remainingBudget, 0) / daysRemainingIncludingToday
      : null;

  const usagePercent =
    budget && Number(budget.amount) > 0 ? (monthTotal / Number(budget.amount)) * 100 : null;

  const warningTriggered =
    budget !== null &&
    usagePercent !== null &&
    usagePercent >= Number(budget.warning_threshold_percent);

  const budgetExhausted = budget !== null && monthTotal >= Number(budget.amount);

  return {
    monthIso: monthKey(now),
    todayTotal,
    monthTotal,
    budget,
    remainingBudget,
    totalDaysInMonth,
    daysRemainingIncludingToday,
    recommendedDailyBudget,
    usagePercent,
    warningTriggered,
    budgetExhausted,
  };
}

/**
 * Non-essential categories (Shopping, Entertainment, Coffee & Bubble Tea) are
 * blocked once the monthly budget is fully used. Essential categories
 * (Meals, Transportation, Daily Necessities, Medical, Others) always remain
 * available, per the product spec.
 */
export function isCategoryBlocked(category: Category, summary: DashboardSummary): boolean {
  return summary.budgetExhausted && !category.is_essential;
}
