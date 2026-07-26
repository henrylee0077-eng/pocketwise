"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPicker } from "@/components/expenses/CategoryPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { useDashboard } from "@/hooks/use-dashboard";
import { useCreateExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { isCategoryBlocked } from "@/lib/dashboard";
import {
  expenseFormSchema,
  type ExpenseFormInput,
  type ExpenseFormValues,
} from "@/lib/validations";
import { todayIso } from "@/lib/utils";
import type { Expense } from "@/types";

export function ExpenseForm({
  expense,
  onSuccess,
  onCancel,
}: {
  expense?: Expense;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const { t } = useLanguage();
  const { data: categories = [] } = useCategories();
  const { summary } = useDashboard();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: expense ? Number(expense.amount) : undefined,
      categoryId: expense?.category_id ?? "",
      expenseDate: expense?.expense_date ?? todayIso(),
      note: expense?.note ?? "",
    },
  });

  const categoryId = watch("categoryId");

  // Default to the first non-blocked category once categories load.
  useEffect(() => {
    if (!expense && !categoryId && categories.length > 0) {
      const firstAvailable =
        categories.find((c) => !summary || !isCategoryBlocked(c, summary)) ?? categories[0];
      if (firstAvailable) setValue("categoryId", firstAvailable.id);
    }
  }, [categories, categoryId, expense, setValue, summary]);

  async function onSubmit(values: ExpenseFormValues) {
    const chosenCategory = categories.find((c) => c.id === values.categoryId);
    if (chosenCategory && summary && isCategoryBlocked(chosenCategory, summary)) {
      toast.error(t("expenses.blockedToast"));
      return;
    }

    try {
      if (expense) {
        await updateExpense.mutateAsync({ id: expense.id, values });
        toast.success(t("expenses.toastUpdated"));
      } else {
        await createExpense.mutateAsync(values);
        toast.success(t("expenses.toastCreated"));
      }
      onSuccess();
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">{t("expenses.amount")}</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            RM
          </span>
          <Input
            id="amount"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            className="pl-11 text-lg font-semibold"
            {...register("amount")}
          />
        </div>
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("expenses.category")}</Label>
        <CategoryPicker
          categories={categories}
          value={categoryId}
          onChange={(id) => setValue("categoryId", id, { shouldValidate: true })}
          summary={summary}
        />
        {errors.categoryId && (
          <p className="text-sm text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="expenseDate">{t("expenses.date")}</Label>
        <Input id="expenseDate" type="date" {...register("expenseDate")} />
        {errors.expenseDate && (
          <p className="text-sm text-destructive">{errors.expenseDate.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">{t("expenses.notes")}</Label>
        <Textarea id="note" placeholder={t("expenses.notesPlaceholder")} {...register("note")} />
        {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t("expenses.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("expenses.save")}
        </Button>
      </div>
    </form>
  );
}
