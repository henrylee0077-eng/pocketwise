import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];

export type CategoryKey =
  | "meals"
  | "transportation"
  | "daily_necessities"
  | "medical"
  | "shopping"
  | "entertainment"
  | "coffee_bubble_tea"
  | "others";

export interface DashboardSummary {
  monthIso: string;
  todayTotal: number;
  monthTotal: number;
  budget: Budget | null;
  remainingBudget: number | null;
  totalDaysInMonth: number;
  daysRemainingIncludingToday: number;
  recommendedDailyBudget: number | null;
  usagePercent: number | null;
  warningTriggered: boolean;
  budgetExhausted: boolean;
}
