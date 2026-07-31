import { z } from "zod";

export const transactionFormSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.coerce
    .number({ error: "Enter an amount." })
    .positive({ message: "Enter an amount greater than 0." })
    .max(999_999_999, { message: "That amount looks too large." }),
  categoryId: z.string().min(1, { message: "Choose a category." }),
  paymentMethodId: z.string().optional().or(z.literal("")),
  priority: z.enum(["high", "medium", "low"]).optional().or(z.literal("")),
  date: z.string().min(1, { message: "Choose a date." }),
  merchant: z
    .string()
    .max(200, { message: "Merchant must be 200 characters or fewer." })
    .optional()
    .or(z.literal("")),
  note: z
    .string()
    .max(500, { message: "Notes must be 500 characters or fewer." })
    .optional()
    .or(z.literal("")),
  tagIds: z.array(z.string()).optional().default([]),
});

/** Raw shape as it exists in form state before zod coerces string -> number. */
export type TransactionFormInput = z.input<typeof transactionFormSchema>;
/** Parsed shape after validation/coercion — what onSubmit receives. */
export type TransactionFormValues = z.output<typeof transactionFormSchema>;

export const budgetFormSchema = z.object({
  amount: z.coerce
    .number({ error: "Enter a budget amount." })
    .nonnegative({ message: "Budget can't be negative." })
    .max(999_999_999, { message: "That amount looks too large." }),
  warningThresholdPercent: z.coerce
    .number({ error: "Enter a percentage." })
    .min(1, { message: "Minimum is 1%." })
    .max(100, { message: "Maximum is 100%." }),
});

export type BudgetFormInput = z.input<typeof budgetFormSchema>;
export type BudgetFormValues = z.output<typeof budgetFormSchema>;

export const categoryBudgetFormSchema = z.object({
  categoryId: z.string().min(1, { message: "Choose a category." }),
  amount: z.coerce
    .number({ error: "Enter a budget amount." })
    .nonnegative({ message: "Budget can't be negative." })
    .max(999_999_999, { message: "That amount looks too large." }),
  warningThresholdPercent: z.coerce
    .number({ error: "Enter a percentage." })
    .min(1, { message: "Minimum is 1%." })
    .max(100, { message: "Maximum is 100%." }),
});

export type CategoryBudgetFormInput = z.input<typeof categoryBudgetFormSchema>;
export type CategoryBudgetFormValues = z.output<typeof categoryBudgetFormSchema>;

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Pick a valid color." });

export const categoryFormSchema = z.object({
  type: z.enum(["expense", "income"]),
  nameEn: z.string().min(1, { message: "English name is required." }).max(60),
  nameZh: z.string().min(1, { message: "中文名称为必填项。" }).max(60),
  icon: z.string().min(1, { message: "Choose an icon." }),
  color: hexColor,
  isEssential: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const tagFormSchema = z.object({
  name: z.string().min(1, { message: "Enter a tag name." }).max(40),
  color: hexColor,
});

export type TagFormValues = z.infer<typeof tagFormSchema>;
