import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type CategoryBudget = Database["public"]["Tables"]["category_budgets"]["Row"];

export type TransactionType = "expense" | "income";
export type TransactionPriority = "high" | "medium" | "low";

export type CategoryKey =
  | "meals"
  | "transportation"
  | "daily_necessities"
  | "medical"
  | "shopping"
  | "entertainment"
  | "coffee_bubble_tea"
  | "others"
  | "salary"
  | "bonus"
  | "freelance"
  | "investment"
  | "gift_income"
  | "other_income";

/** A transaction joined with the tag ids attached to it (via transaction_tags). */
export interface TransactionWithTags extends Transaction {
  tagIds: string[];
}

export interface CategoryBudgetStatus {
  categoryId: string;
  budget: CategoryBudget;
  spent: number;
  remaining: number;
  usagePercent: number;
  warningTriggered: boolean;
  exceeded: boolean;
}

export interface DashboardSummary {
  monthIso: string;

  todayExpenseTotal: number;
  todayIncomeTotal: number;
  monthExpenseTotal: number;
  monthIncomeTotal: number;
  monthNet: number;

  /** Overall monthly budget (expense-only), unrelated to per-category budgets. */
  budget: Budget | null;
  remainingBudget: number | null;
  totalDaysInMonth: number;
  daysRemainingIncludingToday: number;
  recommendedDailyBudget: number | null;
  usagePercent: number | null;
  warningTriggered: boolean;
  budgetExhausted: boolean;

  categoryBudgets: CategoryBudgetStatus[];
}

/** Filters applied to the transaction list / search UI. */
export interface TransactionFilters {
  type?: TransactionType;
  categoryIds?: string[];
  paymentMethodIds?: string[];
  tagIds?: string[];
  priority?: TransactionPriority;
  merchantQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}
