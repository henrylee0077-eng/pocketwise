"use client";

import * as LucideIcons from "lucide-react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Category, DashboardSummary } from "@/types";
import { isCategoryBlocked } from "@/lib/dashboard";

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name];
  const Fallback = LucideIcons.MoreHorizontal;
  const Comp = Icon ?? Fallback;
  return <Comp className={className} />;
}

function categoryName(category: Category, locale: "en" | "zh") {
  return locale === "zh" ? category.name_zh : category.name_en;
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  summary,
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  summary: DashboardSummary | null;
}) {
  const { locale, t } = useLanguage();

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
      {categories.map((category) => {
        const blocked = summary ? isCategoryBlocked(category, summary) : false;
        const selected = value === category.id;
        return (
          <button
            key={category.id}
            type="button"
            disabled={blocked}
            onClick={() => onChange(category.id)}
            title={blocked ? t("expenses.categoryBlocked") : undefined}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all",
              selected
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:bg-secondary",
              blocked && "cursor-not-allowed opacity-40 hover:bg-card",
            )}
          >
            {blocked && (
              <Lock className="absolute right-1.5 top-1.5 size-3 text-muted-foreground" />
            )}
            <span
              className="flex size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${category.color}22`, color: category.color }}
            >
              <CategoryIcon name={category.icon} className="size-4.5" />
            </span>
            <span className="text-xs font-medium leading-tight text-foreground">
              {categoryName(category, locale)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { CategoryIcon, categoryName };
