import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type CategoryBudget = Database["public"]["Tables"]["category_budgets"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type AccountBalance = Database["public"]["Views"]["account_balances"]["Row"];
export type RecurringTransaction = Database["public"]["Tables"]["recurring_transactions"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectSpend = Database["public"]["Views"]["project_spend"]["Row"];

export type TransactionType = "expense" | "income" | "transfer";
export type TransactionPriority = "high" | "medium" | "low";
export type AccountType =
  | "cash"
  | "bank"
  | "ewallet"
  | "investment"
  | "credit_card"
  | "loan"
  | "installment";
export const ASSET_ACCOUNT_TYPES: AccountType[] = ["cash", "bank", "ewallet", "investment"];
export const LIABILITY_ACCOUNT_TYPES: AccountType[] = ["credit_card", "loan", "installment"];
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

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
  accountIds?: string[];
  tagIds?: string[];
  priority?: TransactionPriority;
  merchantQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accounts: AccountBalance[];
}
