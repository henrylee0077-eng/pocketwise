"use client";

import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

export const ACCOUNT_ICON_OPTIONS = [
  "Wallet", "Landmark", "Smartphone", "TrendingUp", "CreditCard",
  "Banknote", "PiggyBank", "HandCoins", "Building2", "Coins",
] as const;

export function AccountIcon({ name, className }: { name: string; className?: string }) {
  const Icon =
    (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name] ??
    LucideIcons.Wallet;
  return <Icon className={className} />;
}

export function AccountIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ACCOUNT_ICON_OPTIONS.map((iconName) => {
        const selected = value === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border transition-colors",
              selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary",
            )}
          >
            <AccountIcon name={iconName} className="size-4.5" />
          </button>
        );
      })}
    </div>
  );
}
