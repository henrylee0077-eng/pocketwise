import { z } from "zod";

export const transactionFormSchema = z
  .object({
    type: z.enum(["expense", "income", "transfer"]),
    amount: z.coerce
      .number({ error: "Enter an amount." })
      .positive({ message: "Enter an amount greater than 0." })
      .max(999_999_999, { message: "That amount looks too large." }),
    categoryId: z.string().optional().or(z.literal("")),
    paymentMethodId: z.string().optional().or(z.literal("")),
    accountId: z.string().optional().or(z.literal("")),
    toAccountId: z.string().optional().or(z.literal("")),
    projectId: z.string().optional().or(z.literal("")),
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
  })
  .superRefine((values, ctx) => {
    if (values.type !== "transfer" && !values.categoryId) {
      ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Choose a category." });
    }
    if (values.type === "transfer") {
      if (!values.accountId) {
        ctx.addIssue({ code: "custom", path: ["accountId"], message: "Choose a source account." });
      }
      if (!values.toAccountId) {
        ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Choose a destination account." });
      }
      if (values.accountId && values.toAccountId && values.accountId === values.toAccountId) {
        ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Pick two different accounts." });
      }
    }
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

const optionalAmount = (max = 999_999_999) =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().max(max, { message: "That amount looks too large." }).optional(),
  );

const optionalDayOfMonth = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.number().int().min(1, { message: "1-31" }).max(31, { message: "1-31" }).optional(),
);

const optionalPercent = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.number().positive().max(100, { message: "Max 100%." }).optional(),
);

export const accountFormSchema = z.object({
  name: z.string().min(1, { message: "Enter an account name." }).max(60),
  type: z.enum(["cash", "bank", "ewallet", "investment", "credit_card", "loan", "installment"]),
  institution: z.string().max(100).optional().or(z.literal("")),
  openingBalance: z.coerce
    .number({ error: "Enter a balance." })
    .min(-999_999_999, { message: "That amount looks too large." })
    .max(999_999_999, { message: "That amount looks too large." }),
  color: hexColor,
  icon: z.string().min(1, { message: "Choose an icon." }),
  creditLimit: optionalAmount(),
  interestRate: optionalPercent,
  statementDay: optionalDayOfMonth,
  paymentDueDay: optionalDayOfMonth,
  minPaymentPercent: optionalPercent,
});

export type AccountFormInput = z.input<typeof accountFormSchema>;
export type AccountFormValues = z.output<typeof accountFormSchema>;

export const projectFormSchema = z
  .object({
    name: z.string().min(1, { message: "Enter a project name." }).max(60),
    color: hexColor,
    icon: z.string().min(1, { message: "Choose an icon." }),
    targetAmount: optionalAmount(),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the start date." });
    }
  });

export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ProjectFormValues = z.output<typeof projectFormSchema>;

export const recurringTransactionFormSchema = z
  .object({
    type: z.enum(["expense", "income", "transfer"]),
    amount: z.coerce
      .number({ error: "Enter an amount." })
      .positive({ message: "Enter an amount greater than 0." })
      .max(999_999_999, { message: "That amount looks too large." }),
    categoryId: z.string().optional().or(z.literal("")),
    paymentMethodId: z.string().optional().or(z.literal("")),
    accountId: z.string().optional().or(z.literal("")),
    toAccountId: z.string().optional().or(z.literal("")),
    priority: z.enum(["high", "medium", "low"]).optional().or(z.literal("")),
    merchant: z.string().max(200).optional().or(z.literal("")),
    note: z.string().max(500).optional().or(z.literal("")),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    intervalCount: z.coerce
      .number({ error: "Enter a number." })
      .int()
      .positive({ message: "Must be at least 1." })
      .max(365, { message: "That's too frequent to be useful." }),
    startDate: z.string().min(1, { message: "Choose a start date." }),
    endDate: z.string().optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (values.type !== "transfer" && !values.categoryId) {
      ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Choose a category." });
    }
    if (values.type === "transfer") {
      if (!values.accountId) {
        ctx.addIssue({ code: "custom", path: ["accountId"], message: "Choose a source account." });
      }
      if (!values.toAccountId) {
        ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Choose a destination account." });
      }
      if (values.accountId && values.toAccountId && values.accountId === values.toAccountId) {
        ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Pick two different accounts." });
      }
    }
    if (values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be after the start date." });
    }
  });

export type RecurringTransactionFormInput = z.input<typeof recurringTransactionFormSchema>;
export type RecurringTransactionFormValues = z.output<typeof recurringTransactionFormSchema>;

export const quickAddTurnSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().min(1).max(500),
});
export type QuickAddTurn = z.infer<typeof quickAddTurnSchema>;

export const quickAddRequestSchema = z.object({
  turns: z.array(quickAddTurnSchema).min(1).max(12),
});
export type QuickAddRequest = z.infer<typeof quickAddRequestSchema>;

/**
 * Raw shape returned by Gemini's structured output, before we resolve/
 * sanitize ids against the user's real data. `status` drives the
 * conversation: "needs_clarification" means the model needs one more
 * detail before it's confident enough to save anything, in which case only
 * `clarifyingQuestion` matters and the transaction fields are ignored.
 */
export const quickAddExtractionSchema = z
  .object({
    status: z.enum(["ready", "needs_clarification"]),
    clarifyingQuestion: z.string(),
    type: z.enum(["expense", "income", "transfer"]),
    amount: z.number().min(0),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Expected yyyy-MM-dd." }),
    categoryId: z.string(),
    newCategoryName: z.string(),
    accountId: z.string(),
    toAccountId: z.string(),
    paymentMethodId: z.string(),
    newPaymentMethodName: z.string(),
    merchant: z.string(),
    note: z.string(),
    priority: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.status === "ready" && val.amount <= 0) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Amount must be greater than 0." });
    }
  });
export type QuickAddExtraction = z.infer<typeof quickAddExtractionSchema>;
