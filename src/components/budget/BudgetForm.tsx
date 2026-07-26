"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useUpsertBudget } from "@/hooks/use-budget";
import {
  budgetFormSchema,
  type BudgetFormInput,
  type BudgetFormValues,
} from "@/lib/validations";
import { DEFAULT_WARNING_THRESHOLD_PERCENT } from "@/lib/constants";
import type { Budget } from "@/types";

export function BudgetForm({ monthIso, budget }: { monthIso: string; budget: Budget | null }) {
  const { t } = useLanguage();
  const upsertBudget = useUpsertBudget(monthIso);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormInput, unknown, BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      amount: budget ? Number(budget.amount) : undefined,
      warningThresholdPercent: budget
        ? Number(budget.warning_threshold_percent)
        : DEFAULT_WARNING_THRESHOLD_PERCENT,
    },
  });

  useEffect(() => {
    reset({
      amount: budget ? Number(budget.amount) : undefined,
      warningThresholdPercent: budget
        ? Number(budget.warning_threshold_percent)
        : DEFAULT_WARNING_THRESHOLD_PERCENT,
    });
  }, [budget, reset]);

  async function onSubmit(values: BudgetFormValues) {
    try {
      await upsertBudget.mutateAsync(values);
      toast.success(t("budget.saved"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="budgetAmount">{t("budget.monthlyAmount")}</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            RM
          </span>
          <Input
            id="budgetAmount"
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
        <Label htmlFor="warningThreshold">{t("budget.warningThreshold")}</Label>
        <div className="relative">
          <Input
            id="warningThreshold"
            inputMode="numeric"
            className="pr-9"
            {...register("warningThresholdPercent")}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            %
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t("budget.warningThresholdHint")}</p>
        {errors.warningThresholdPercent && (
          <p className="text-sm text-destructive">{errors.warningThresholdPercent.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {t("budget.save")}
      </Button>
    </form>
  );
}
