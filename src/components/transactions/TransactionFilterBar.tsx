"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useTags } from "@/hooks/use-tags";
import { categoryName } from "@/components/transactions/CategoryPicker";
import type { TransactionFilters, TransactionPriority, TransactionType } from "@/types";

const ALL = "__all__";

export function TransactionFilterBar({
  filters,
  onChange,
}: {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}) {
  const { locale, t } = useLanguage();
  const { data: categories = [] } = useCategories();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: tags = [] } = useTags();
  const [expanded, setExpanded] = useState(false);

  const activeCount = [
    filters.type,
    filters.categoryIds?.length,
    filters.paymentMethodIds?.length,
    filters.tagIds?.length,
    filters.priority,
  ].filter(Boolean).length;

  function toggleCategory(id: string) {
    const current = filters.categoryIds ?? [];
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    onChange({ ...filters, categoryIds: next.length > 0 ? next : undefined });
  }

  function toggleTag(id: string) {
    const current = filters.tagIds ?? [];
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    onChange({ ...filters, tagIds: next.length > 0 ? next : undefined });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          value={filters.merchantQuery ?? ""}
          onChange={(e) => onChange({ ...filters, merchantQuery: e.target.value || undefined })}
          placeholder={t("transactions.searchPlaceholder")}
          className="flex-1"
        />
        <Button
          type="button"
          variant={expanded ? "default" : "outline"}
          size="icon"
          onClick={() => setExpanded((v) => !v)}
          aria-label={t("transactions.filters")}
        >
          <SlidersHorizontal className="size-4" />
        </Button>
        {activeCount > 0 && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange({})}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t("transactions.type")}</span>
            <Select
              value={filters.type ?? ALL}
              onValueChange={(v) =>
                onChange({ ...filters, type: v === ALL ? undefined : (v as TransactionType) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("expenses.filterAll")}</SelectItem>
                <SelectItem value="expense">{t("transactions.typeExpense")}</SelectItem>
                <SelectItem value="income">{t("transactions.typeIncome")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t("transactions.priority")}</span>
            <Select
              value={filters.priority ?? ALL}
              onValueChange={(v) =>
                onChange({ ...filters, priority: v === ALL ? undefined : (v as TransactionPriority) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("expenses.filterAll")}</SelectItem>
                <SelectItem value="high">{t("transactions.priorityHigh")}</SelectItem>
                <SelectItem value="medium">{t("transactions.priorityMedium")}</SelectItem>
                <SelectItem value="low">{t("transactions.priorityLow")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t("expenses.category")}</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => {
                const selected = (filters.categoryIds ?? []).includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {categoryName(category, locale)}
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethods.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t("transactions.paymentMethod")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.map((method) => {
                  const selected = (filters.paymentMethodIds ?? []).includes(method.id);
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        const current = filters.paymentMethodIds ?? [];
                        const next = current.includes(method.id)
                          ? current.filter((c) => c !== method.id)
                          : [...current, method.id];
                        onChange({
                          ...filters,
                          paymentMethodIds: next.length > 0 ? next : undefined,
                        });
                      }}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {locale === "zh" ? method.name_zh : method.name_en}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">{t("transactions.tags")}</span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const selected = (filters.tagIds ?? []).includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
