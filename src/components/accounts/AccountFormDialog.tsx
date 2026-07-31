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
import { CategoryColorPicker } from "@/components/settings/CategoryColorPicker";
import { AccountIconPicker } from "@/components/accounts/AccountIconPicker";
import { AccountTypePicker } from "@/components/accounts/AccountTypePicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCreateAccount, useUpdateAccount } from "@/hooks/use-accounts";
import { accountFormSchema, type AccountFormInput, type AccountFormValues } from "@/lib/validations";
import { LIABILITY_ACCOUNT_TYPES, type Account, type AccountType } from "@/types";

const DEFAULTS = {
  name: "",
  type: "cash" as AccountType,
  institution: "",
  openingBalance: 0,
  color: "#0D9488",
  icon: "Wallet",
  creditLimit: undefined,
  interestRate: undefined,
  statementDay: undefined,
  paymentDueDay: undefined,
  minPaymentPercent: undefined,
};

function toFormValues(account?: Account) {
  if (!account) return DEFAULTS;
  const isLiability = LIABILITY_ACCOUNT_TYPES.includes(account.type);
  return {
    name: account.name,
    type: account.type,
    institution: account.institution ?? "",
    openingBalance: isLiability ? Math.abs(Number(account.opening_balance)) : Number(account.opening_balance),
    color: account.color,
    icon: account.icon,
    creditLimit: account.credit_limit ?? undefined,
    interestRate: account.interest_rate ?? undefined,
    statementDay: account.statement_day ?? undefined,
    paymentDueDay: account.payment_due_day ?? undefined,
    minPaymentPercent: account.min_payment_percent ?? undefined,
  };
}

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
}) {
  const { t } = useLanguage();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormInput, unknown, AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: toFormValues(account),
  });

  useEffect(() => {
    if (open) reset(toFormValues(account));
  }, [open, account, reset]);

  const type = watch("type");
  const color = watch("color");
  const icon = watch("icon");
  const isLiability = LIABILITY_ACCOUNT_TYPES.includes(type);

  async function onSubmit(values: AccountFormValues) {
    const payload = {
      ...values,
      openingBalance: isLiability ? -Math.abs(values.openingBalance) : values.openingBalance,
    };
    try {
      if (account) {
        await updateAccount.mutateAsync({ id: account.id, values: payload });
      } else {
        await createAccount.mutateAsync(payload);
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
          <DialogTitle>{account ? t("accounts.editAccount") : t("accounts.newAccount")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <AccountTypePicker
            value={type}
            onChange={(v) => setValue("type", v)}
            disabled={Boolean(account)}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t("accounts.name")}</Label>
            <Input id="name" placeholder={t("accounts.namePlaceholder")} {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="institution">{t("accounts.institution")}</Label>
            <Input id="institution" placeholder={t("accounts.institutionPlaceholder")} {...register("institution")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="openingBalance">
              {isLiability ? t("accounts.openingBalanceOwed") : t("accounts.openingBalance")}
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                RM
              </span>
              <Input
                id="openingBalance"
                inputMode="decimal"
                step="0.01"
                className="pl-11"
                {...register("openingBalance")}
              />
            </div>
            {errors.openingBalance && (
              <p className="text-sm text-destructive">{errors.openingBalance.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("categories.color")}</Label>
            <CategoryColorPicker value={color} onChange={(c) => setValue("color", c)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("categories.icon")}</Label>
            <AccountIconPicker value={icon} onChange={(i) => setValue("icon", i)} />
          </div>

          {type === "credit_card" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="creditLimit">{t("accounts.creditLimit")}</Label>
                <Input id="creditLimit" inputMode="decimal" {...register("creditLimit")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="minPaymentPercent">{t("accounts.minPaymentPercent")}</Label>
                <Input id="minPaymentPercent" inputMode="decimal" {...register("minPaymentPercent")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="statementDay">{t("accounts.statementDay")}</Label>
                <Input id="statementDay" inputMode="numeric" {...register("statementDay")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="paymentDueDay">{t("accounts.paymentDueDay")}</Label>
                <Input id="paymentDueDay" inputMode="numeric" {...register("paymentDueDay")} />
              </div>
            </div>
          )}

          {type === "loan" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="interestRate">{t("accounts.interestRate")}</Label>
                <Input id="interestRate" inputMode="decimal" {...register("interestRate")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="paymentDueDay">{t("accounts.paymentDueDay")}</Label>
                <Input id="paymentDueDay" inputMode="numeric" {...register("paymentDueDay")} />
              </div>
            </div>
          )}

          {type === "installment" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="paymentDueDay">{t("accounts.paymentDueDay")}</Label>
              <Input id="paymentDueDay" inputMode="numeric" className="max-w-[140px]" {...register("paymentDueDay")} />
            </div>
          )}

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
