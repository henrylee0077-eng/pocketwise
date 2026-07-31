"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatPeriodLabel, type ReportPeriodType, type ReportRange } from "@/lib/reports";

export function PeriodSelector({
  periodType,
  onPeriodTypeChange,
  range,
  onPrev,
  onNext,
  onToday,
}: {
  periodType: ReportPeriodType;
  onPeriodTypeChange: (type: ReportPeriodType) => void;
  range: ReportRange;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const { locale, t } = useLanguage();

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={periodType} onValueChange={(v) => onPeriodTypeChange(v as ReportPeriodType)}>
        <TabsList className="w-full">
          <TabsTrigger value="week" className="flex-1">
            {t("reports.week")}
          </TabsTrigger>
          <TabsTrigger value="month" className="flex-1">
            {t("reports.month")}
          </TabsTrigger>
          <TabsTrigger value="year" className="flex-1">
            {t("reports.year")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={t("reports.previousPeriod")}
        >
          <ChevronLeft className="size-4" />
        </button>

        <button
          type="button"
          onClick={onToday}
          className="text-sm font-semibold text-foreground hover:underline"
        >
          {formatPeriodLabel(periodType, range, locale)}
        </button>

        <button
          type="button"
          onClick={onNext}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={t("reports.nextPeriod")}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
