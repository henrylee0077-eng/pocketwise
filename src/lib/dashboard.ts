import type {
  Budget,
  Category,
  CategoryBudget,
  CategoryBudgetStatus,
  DashboardSummary,
  Transaction,
} from "@/types";
import { getMonthProgress, monthKey, todayIso } from "@/lib/utils";

function sumAmount(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
}

/**
 * Pure computation of the dashboard numbers from raw data. Kept separate
 * from data-fetching so the budget math (today's/month's income & expense,
 * remaining budget, recommended daily spend, per-category alerts) can be
 * unit tested without touching Supabase or React.
 */
export function computeDashboardSummary(
  monthTransactions: Transaction[],
  budget: Budget | null,
  categoryBudgets: CategoryBudget[],
  now: Date = new Date(),
): DashboardSummary {
  const today = todayIso();

  const expenseTxns = monthTransactions.filter((t) => t.type === "expense");
  const incomeTxns = monthTransactions.filter((t) => t.type === "income");

  const monthExpenseTotal = sumAmount(expenseTxns);
  const monthIncomeTotal = sumAmount(incomeTxns);
  const todayExpenseTotal = sumAmount(expenseTxns.filter((t) => t.expense_date === today));
  const todayIncomeTotal = sumAmount(incomeTxns.filter((t) => t.expense_date === today));
  const monthNet = monthIncomeTotal - monthExpenseTotal;

  const { totalDaysInMonth, daysRemainingIncludingToday } = getMonthProgress(now);

  const remainingBudget = budget ? Number(budget.amount) - monthExpenseTotal : null;

  const recommendedDailyBudget =
    budget && remainingBudget !== null
      ? Math.max(remainingBudget, 0) / daysRemainingIncludingToday
      : null;

  const usagePercent =
    budget && Number(budget.amount) > 0 ? (monthExpenseTotal / Number(budget.amount)) * 100 : null;

  const warningTriggered =
    budget !== null &&
    usagePercent !== null &&
    usagePercent >= Number(budget.warning_threshold_percent);

  const budgetExhausted = budget !== null && monthExpenseTotal >= Number(budget.amount);

  const categoryBudgetStatuses: CategoryBudgetStatus[] = categoryBudgets.map((cb) => {
    const spent = sumAmount(expenseTxns.filter((t) => t.category_id === cb.category_id));
    const amount = Number(cb.amount);
    const remaining = amount - spent;
    const catUsagePercent = amount > 0 ? (spent / amount) * 100 : 0;
    return {
      categoryId: cb.category_id,
      budget: cb,
      spent,
      remaining,
      usagePercent: catUsagePercent,
      warningTriggered: catUsagePercent >= Number(cb.warning_threshold_percent),
      exceeded: amount > 0 && spent >= amount,
    };
  });

  return {
    monthIso: monthKey(now),
    todayExpenseTotal,
    todayIncomeTotal,
    monthExpenseTotal,
    monthIncomeTotal,
    monthNet,
    budget,
    remainingBudget,
    totalDaysInMonth,
    daysRemainingIncludingToday,
    recommendedDailyBudget,
    usagePercent,
    warningTriggered,
    budgetExhausted,
    categoryBudgets: categoryBudgetStatuses,
  };
}

/**
 * Non-essential categories (Shopping, Entertainment, Coffee & Bubble Tea) are
 * blocked once the overall monthly budget is fully used. Essential
 * categories (Meals, Transportation, Daily Necessities, Medical, Others) and
 * all income categories always remain available, per the product spec.
 */
export function isCategoryBlocked(category: Category, summary: DashboardSummary): boolean {
  if (category.type === "income") return false;
  return summary.budgetExhausted && !category.is_essential;
}
