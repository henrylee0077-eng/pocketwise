"use client";

import { useEffect, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryPicker } from "@/components/transactions/CategoryPicker";
import { PaymentMethodPicker } from "@/components/transactions/PaymentMethodPicker";
import { PriorityPicker } from "@/components/transactions/PriorityPicker";
import { AccountPicker } from "@/components/accounts/AccountPicker";
import { cn, todayIso } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import {
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
} from "@/hooks/use-recurring-transactions";
import {
  recurringTransactionFormSchema,
  type RecurringTransactionFormInput,
  type RecurringTransactionFormValues,
} from "@/lib/validations";
import type { RecurringFrequency, RecurringTransaction, TransactionPriority, TransactionType } from "@/types";

const FREQUENCIES: RecurringFrequency[] = ["daily", "weekly", "monthly", "yearly"];

export function RecurringFormDialog({
  open,
  onOpenChange,
  rule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: RecurringTransaction;
}) {
  const { t } = useLanguage();
  const { data: categories = [] } = useCategories();
  const createRule = useCreateRecurringTransaction();
  const updateRule = useUpdateRecurringTransaction();

  const defaultValues: RecurringTransactionFormInput = {
    type: (rule?.type ?? "expense") as TransactionType,
    amount: rule ? Number(rule.amount) : undefined,
    categoryId: rule?.category_id ?? "",
    paymentMethodId: rule?.payment_method_id ?? "",
    accountId: rule?.account_id ?? "",
    toAccountId: rule?.to_account_id ?? "",
    priority: (rule?.priority ?? "") as TransactionPriority | "",
    merchant: rule?.merchant ?? "",
    note: rule?.note ?? "",
    frequency: (rule?.frequency ?? "monthly") as RecurringFrequency,
    intervalCount: rule?.interval_count ?? 1,
    startDate: rule?.start_date ?? todayIso(),
    endDate: rule?.end_date ?? "",
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecurringTransactionFormInput, unknown, RecurringTransactionFormValues>({
    resolver: zodResolver(recurringTransactionFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rule, reset]);

  const type = watch("type");
  const categoryId = watch("categoryId");
  const paymentMethodId = watch("paymentMethodId");
  const accountId = watch("accountId");
  const toAccountId = watch("toAccountId");
  const priority = watch("priority");
  const frequency = watch("frequency");

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  function handleTypeChange(nextType: TransactionType) {
    if (nextType === type) return;
    setValue("type", nextType);
    setValue("categoryId", "");
    setValue("toAccountId", "");
  }

  async function onSubmit(values: RecurringTransactionFormValues) {
    try {
      if (rule) {
        await updateRule.mutateAsync({ id: rule.id, values });
      } else {
        await createRule.mutateAsync(values);
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? t("recurring.editRule") : t("recurring.newRule")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-2">
            {(["expense", "income", "transfer"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleTypeChange(option)}
                className={cn(
                  "rounded-xl border py-2 text-sm font-semibold transition-colors",
                  type === option
                    ? option === "expense"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : option === "income"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-foreground/30 bg-secondary text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary",
                )}
              >
                {t(
                  option === "expense"
                    ? "transactions.typeExpense"
                    : option === "income"
                      ? "transactions.typeIncome"
                      : "transactions.typeTransfer",
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">{t("expenses.amount")}</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                RM
              </span>
              <Input id="amount" inputMode="decimal" step="0.01" className="pl-11" {...register("amount")} />
            </div>
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>

          {type === "transfer" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>{t("transactions.fromAccount")}</Label>
                <AccountPicker value={accountId ?? ""} onChange={(id) => setValue("accountId", id)} />
                {errors.accountId && <p className="text-sm text-destructive">{errors.accountId.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("transactions.toAccount")}</Label>
                <AccountPicker
                  value={toAccountId ?? ""}
                  onChange={(id) => setValue("toAccountId", id)}
                  excludeId={accountId || undefined}
                />
                {errors.toAccountId && (
                  <p className="text-sm text-destructive">{errors.toAccountId.message}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label>{t("expenses.category")}</Label>
                <CategoryPicker
                  categories={categoriesForType}
                  value={categoryId ?? ""}
                  onChange={(id) => setValue("categoryId", id, { shouldValidate: true })}
                  summary={null}
                />
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("transactions.account")}</Label>
                <AccountPicker value={accountId ?? ""} onChange={(id) => setValue("accountId", id)} />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="merchant">{t("transactions.merchant")}</Label>
            <Input id="merchant" placeholder={t("transactions.merchantPlaceholder")} {...register("merchant")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("transactions.paymentMethod")}</Label>
            <PaymentMethodPicker value={paymentMethodId ?? ""} onChange={(id) => setValue("paymentMethodId", id)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("transactions.priority")}</Label>
            <PriorityPicker value={priority ?? ""} onChange={(v) => setValue("priority", v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>{t("recurring.frequency")}</Label>
              <Select value={frequency} onValueChange={(v: RecurringFrequency) => setValue("frequency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {t(`recurring.frequency${f.charAt(0).toUpperCase()}${f.slice(1)}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="intervalCount">{t("recurring.every")}</Label>
              <Input id="intervalCount" inputMode="numeric" {...register("intervalCount")} />
              {errors.intervalCount && (
                <p className="text-sm text-destructive">{errors.intervalCount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">{t("recurring.startDate")}</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">{t("recurring.endDate")}</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t("expenses.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
