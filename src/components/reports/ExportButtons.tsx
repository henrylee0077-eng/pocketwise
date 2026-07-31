"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { ReportRange } from "@/lib/reports";

async function downloadExport(format: "xlsx" | "pdf", range: ReportRange, label: string) {
  const params = new URLSearchParams({ start: range.startIso, end: range.endIso });
  const res = await fetch(`/api/export/${format}?${params.toString()}`);
  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pocketwise-${label}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ range }: { range: ReportRange }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState<"xlsx" | "pdf" | null>(null);

  async function handleExport(format: "xlsx" | "pdf") {
    setPending(format);
    try {
      await downloadExport(format, range, `${range.startIso}_${range.endIso}`);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")} disabled={pending !== null}>
        {pending === "xlsx" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
        {t("reports.exportExcel")}
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={pending !== null}>
        {pending === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
        {t("reports.exportPdf")}
      </Button>
    </div>
  );
}
