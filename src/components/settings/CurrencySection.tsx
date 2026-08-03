"use client";

import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePreferredCurrency } from "@/hooks/use-currency";
import { useSetPreferredCurrency } from "@/hooks/use-security";
import { CURRENCIES } from "@/lib/currencies";

export function CurrencySection() {
  const { t, locale } = useLanguage();
  const currency = usePreferredCurrency();
  const setPreferredCurrency = useSetPreferredCurrency();

  function handleChange(code: string) {
    if (code === currency) return;
    setPreferredCurrency.mutate(code, {
      onSuccess: () => toast.success(t("settings.currencyUpdated")),
      onError: () => toast.error(t("common.error")),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.currency")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t("settings.currencyDescription")}</p>
        <Select value={currency} onValueChange={handleChange} disabled={setPreferredCurrency.isPending}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">{c.code}</span>
                  {locale === "zh" ? c.nameZh : c.nameEn}
                  <span className="text-muted-foreground">({c.symbol})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
