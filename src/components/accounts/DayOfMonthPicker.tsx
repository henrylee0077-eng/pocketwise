"use client";

import { CalendarDays, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * Picks a recurring day-of-month (1-31), e.g. a credit card's statement or
 * payment due day. Not a real calendar date — there's no month/year context,
 * just "this happens on the Nth day of every month" — so a 1-31 grid in a
 * popover fits better than a full date picker.
 */
export function DayOfMonthPicker({
  value,
  onChange,
  id,
}: {
  value: number | undefined;
  onChange: (day: number | undefined) => void;
  id?: string;
}) {
  const { t } = useLanguage();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-4 py-2 text-left text-base text-foreground shadow-sm transition-colors hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={cn(value == null && "text-muted-foreground")}>
            {value != null ? t("accounts.dayOfMonth", { day: value }) : t("accounts.selectDay")}
          </span>
          <CalendarDays className="size-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px]">
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day) => {
            const selected = value === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onChange(day)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-sm transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
        {value != null && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3.5" />
            {t("common.clear")}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
