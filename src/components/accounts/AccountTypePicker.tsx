"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { AccountIcon } from "@/components/accounts/AccountIconPicker";
import type { AccountType } from "@/types";

const TYPE_ICON: Record<AccountType, string> = {
  cash: "Wallet",
  bank: "Landmark",
  ewallet: "Smartphone",
  investment: "TrendingUp",
  credit_card: "CreditCard",
  loan: "HandCoins",
  installment: "Banknote",
};

const TYPE_KEY: Record<AccountType, string> = {
  cash: "accounts.typeCash",
  bank: "accounts.typeBank",
  ewallet: "accounts.typeEwallet",
  investment: "accounts.typeInvestment",
  credit_card: "accounts.typeCreditCard",
  loan: "accounts.typeLoan",
  installment: "accounts.typeInstallment",
};

const ASSET_TYPES: AccountType[] = ["cash", "bank", "ewallet", "investment"];
const LIABILITY_TYPES: AccountType[] = ["credit_card", "loan", "installment"];

export function AccountTypePicker({
  value,
  onChange,
  disabled,
}: {
  value: AccountType;
  onChange: (type: AccountType) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();

  function renderGroup(types: AccountType[], label: string) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {types.map((type) => {
            const selected = value === type;
            return (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => onChange(type)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary",
                )}
              >
                <AccountIcon name={TYPE_ICON[type]} className="size-5" />
                {t(TYPE_KEY[type])}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {renderGroup(ASSET_TYPES, t("accounts.assetTypes"))}
      {renderGroup(LIABILITY_TYPES, t("accounts.liabilityTypes"))}
    </div>
  );
}
