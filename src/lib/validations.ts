import { z } from "zod";

export const expenseFormSchema = z.object({
  amount: z.coerce
    .number({ error: "Enter an amount." })
    .positive({ message: "Enter an amount greater than 0." })
    .max(999_999_999, { message: "That amount looks too large." }),
  categoryId: z.string().min(1, { message: "Choose a category." }),
  expenseDate: z.string().min(1, { message: "Choose a date." }),
  note: z
    .string()
    .max(500, { message: "Notes must be 500 characters or fewer." })
    .optional()
    .or(z.literal("")),
});

/** Raw shape as it exists in form state before zod coerces string -> number. */
export type ExpenseFormInput = z.input<typeof expenseFormSchema>;
/** Parsed shape after validation/coercion — what onSubmit receives. */
export type ExpenseFormValues = z.output<typeof expenseFormSchema>;

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
