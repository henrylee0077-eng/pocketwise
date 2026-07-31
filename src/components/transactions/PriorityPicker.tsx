"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TransactionPriority } from "@/types";

const PRIORITIES: TransactionPriority[] = ["high", "medium", "low"];

const PRIORITY_STYLES: Record<TransactionPriority, string> = {
  high: "border-destructive/40 bg-destructive/10 text-destructive",
  medium: "border-warning/40 bg-warning/15 text-warning-foreground",
  low: "border-border bg-secondary text-secondary-foreground",
};

export function PriorityPicker({
  value,
  onChange,
}: {
  value: TransactionPriority | "";
  onChange: (value: TransactionPriority | "") => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2">
      {PRIORITIES.map((priority) => {
        const selected = value === priority;
        return (
          <button
            key={priority}
            type="button"
            onClick={() => onChange(selected ? "" : priority)}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors",
              selected ? PRIORITY_STYLES[priority] : "border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {t(`transactions.priority${priority.charAt(0).toUpperCase()}${priority.slice(1)}`)}
          </button>
        );
      })}
    </div>
  );
}
