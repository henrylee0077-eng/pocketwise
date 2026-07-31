"use client";

import * as LucideIcons from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePaymentMethods } from "@/hooks/use-payment-methods";

export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { locale, t } = useLanguage();
  const { data: methods = [] } = usePaymentMethods();

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={t("transactions.paymentMethodPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {methods.map((method) => {
          const Icon =
            (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[method.icon] ??
            LucideIcons.Wallet;
          return (
            <SelectItem key={method.id} value={method.id}>
              <span className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                {locale === "zh" ? method.name_zh : method.name_en}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
