"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryName } from "@/components/transactions/CategoryPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { useUpsertCategoryBudget } from "@/hooks/use-category-budgets";
import {
  categoryBudgetFormSchema,
  type CategoryBudgetFormInput,
  type CategoryBudgetFormValues,
} from "@/lib/validations";
import { DEFAULT_WARNING_THRESHOLD_PERCENT } from "@/lib/constants";
import type { CategoryBudget } from "@/types";

export function CategoryBudgetFormDialog({
  open,
  onOpenChange,
  monthIso,
  existing,
  excludeCategoryIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthIso: string;
  existing?: CategoryBudget;
  excludeCategoryIds: string[];
}) {
  const { locale, t } = useLanguage();
  const { data: categories = [] } = useCategories();
  const upsertCategoryBudget = useUpsertCategoryBudget(monthIso);

  const expenseCategories = categories.filter(
    (c) => c.type === "expense" && (c.id === existing?.category_id || !excludeCategoryIds.includes(c.id)),
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryBudgetFormInput, unknown, CategoryBudgetFormValues>({
    resolver: zodResolver(categoryBudgetFormSchema),
    defaultValues: {
      categoryId: existing?.category_id ?? "",
      amount: existing ? Number(existing.amount) : undefined,
      warningThresholdPercent: existing
        ? Number(existing.warning_threshold_percent)
        : DEFAULT_WARNING_THRESHOLD_PERCENT,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        categoryId: existing?.category_id ?? "",
        amount: existing ? Number(existing.amount) : undefined,
        warningThresholdPercent: existing
          ? Number(existing.warning_threshold_percent)
          : DEFAULT_WARNING_THRESHOLD_PERCENT,
      });
    }
  }, [open, existing, reset]);

  const categoryId = watch("categoryId");

  async function onSubmit(values: CategoryBudgetFormValues) {
    try {
      await upsertCategoryBudget.mutateAsync(values);
      toast.success(t("budget.categorySaved"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("budget.categoryBudget")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("expenses.category")}</Label>
            <Select
              value={categoryId || undefined}
              onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
              disabled={!!existing}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("transactions.paymentMethodPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {categoryName(category, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cbAmount">{t("budget.monthlyAmount")}</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                RM
              </span>
              <Input id="cbAmount" inputMode="decimal" step="0.01" className="pl-11" {...register("amount")} />
            </div>
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cbThreshold">{t("budget.warningThreshold")}</Label>
            <div className="relative">
              <Input
                id="cbThreshold"
                inputMode="numeric"
                className="pr-9"
                {...register("warningThresholdPercent")}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
            {errors.warningThresholdPercent && (
              <p className="text-sm text-destructive">{errors.warningThresholdPercent.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t("budget.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
