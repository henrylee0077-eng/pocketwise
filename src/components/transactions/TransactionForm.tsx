"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPicker } from "@/components/transactions/CategoryPicker";
import { AccountPicker } from "@/components/accounts/AccountPicker";
import { PaymentMethodPicker } from "@/components/transactions/PaymentMethodPicker";
import { PriorityPicker } from "@/components/transactions/PriorityPicker";
import { TagPicker } from "@/components/transactions/TagPicker";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { useDashboard } from "@/hooks/use-dashboard";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import { isCategoryBlocked } from "@/lib/dashboard";
import {
  transactionFormSchema,
  type TransactionFormInput,
  type TransactionFormValues,
} from "@/lib/validations";
import { todayIso } from "@/lib/utils";
import type { TransactionType, TransactionWithTags } from "@/types";

export function TransactionForm({
  transaction,
  initialValues,
  onSuccess,
  onCancel,
}: {
  transaction?: TransactionWithTags;
  /** Prefills a brand-new (non-editing) form, e.g. from the quick-add parser. Ignored when `transaction` is set. */
  initialValues?: Partial<TransactionFormInput>;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const { t } = useLanguage();
  const { data: categories = [] } = useCategories();
  const { summary } = useDashboard();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormInput, unknown, TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: transaction?.type ?? initialValues?.type ?? "expense",
      amount: transaction ? Number(transaction.amount) : (initialValues?.amount as number | undefined),
      categoryId: transaction?.category_id ?? initialValues?.categoryId ?? "",
      paymentMethodId: transaction?.payment_method_id ?? initialValues?.paymentMethodId ?? "",
      accountId: transaction?.account_id ?? initialValues?.accountId ?? "",
      toAccountId: transaction?.to_account_id ?? initialValues?.toAccountId ?? "",
      priority: transaction?.priority ?? initialValues?.priority ?? "",
      date: transaction?.expense_date ?? initialValues?.date ?? todayIso(),
      merchant: transaction?.merchant ?? initialValues?.merchant ?? "",
      note: transaction?.note ?? initialValues?.note ?? "",
      tagIds: transaction?.tagIds ?? [],
    },
  });

  const type = watch("type");
  const categoryId = watch("categoryId");
  const paymentMethodId = watch("paymentMethodId");
  const accountId = watch("accountId");
  const toAccountId = watch("toAccountId");
  const priority = watch("priority");
  const tagIds = watch("tagIds");

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  // Default to the first non-blocked category whenever the type changes or
  // the currently selected category no longer matches the chosen type.
  useEffect(() => {
    const stillValid = categoriesForType.some((c) => c.id === categoryId);
    if (!stillValid && categoriesForType.length > 0) {
      const firstAvailable =
        categoriesForType.find((c) => !summary || !isCategoryBlocked(c, summary)) ??
        categoriesForType[0];
      if (firstAvailable) setValue("categoryId", firstAvailable.id);
    }
  }, [categoriesForType, categoryId, setValue, summary]);

  function handleTypeChange(nextType: TransactionType) {
    if (nextType === type) return;
    setValue("type", nextType);
    setValue("categoryId", "");
    setValue("toAccountId", "");
  }

  async function onSubmit(values: TransactionFormValues) {
    const chosenCategory = categories.find((c) => c.id === values.categoryId);
    if (chosenCategory && summary && isCategoryBlocked(chosenCategory, summary)) {
      toast.error(t("expenses.blockedToast"));
      return;
    }

    try {
      if (transaction) {
        await updateTransaction.mutateAsync({ id: transaction.id, values });
        toast.success(t("transactions.toastUpdated"));
      } else {
        await createTransaction.mutateAsync(values);
        toast.success(t("transactions.toastCreated"));
      }
      onSuccess();
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2">
        {(["expense", "income", "transfer"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleTypeChange(option)}
            className={cn(
              "rounded-xl border py-2.5 text-sm font-semibold transition-colors",
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

      {type === "transfer" ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("transactions.fromAccount")}</Label>
            <AccountPicker value={accountId ?? ""} onChange={(id) => setValue("accountId", id, { shouldValidate: true })} />
            {errors.accountId && <p className="text-sm text-destructive">{errors.accountId.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("transactions.toAccount")}</Label>
            <AccountPicker
              value={toAccountId ?? ""}
              onChange={(id) => setValue("toAccountId", id, { shouldValidate: true })}
              excludeId={accountId || undefined}
            />
            {errors.toAccountId && <p className="text-sm text-destructive">{errors.toAccountId.message}</p>}
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
              summary={summary}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">{t("expenses.date")}</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="merchant">{t("transactions.merchant")}</Label>
          <Input
            id="merchant"
            placeholder={t("transactions.merchantPlaceholder")}
            {...register("merchant")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("transactions.paymentMethod")}</Label>
        <PaymentMethodPicker
          value={paymentMethodId ?? ""}
          onChange={(id) => setValue("paymentMethodId", id)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("transactions.priority")}</Label>
        <PriorityPicker value={priority ?? ""} onChange={(v) => setValue("priority", v)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("transactions.tags")}</Label>
        <TagPicker value={tagIds ?? []} onChange={(ids) => setValue("tagIds", ids)} />
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
