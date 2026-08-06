"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePreferredCurrency } from "@/hooks/use-currency";
import { fetchCategories } from "@/lib/queries/categories";
import { fetchAccountBalances } from "@/lib/queries/accounts";
import { fetchPaymentMethods } from "@/lib/queries/payment-methods";
import { fetchTransactionsForRange } from "@/lib/queries/transactions";
import type { ReportRange } from "@/lib/reports";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ range }: { range: ReportRange }) {
  const { t } = useLanguage();
  const currency = usePreferredCurrency();
  const [pending, setPending] = useState<"xlsx" | "pdf" | null>(null);

  async function handleExport(format: "xlsx" | "pdf") {
    setPending(format);
    try {
      const [transactions, categories, accounts, paymentMethods] = await Promise.all([
        fetchTransactionsForRange({ start: range.startIso, end: range.endIso }),
        fetchCategories(),
        fetchAccountBalances(),
        fetchPaymentMethods(),
      ]);

      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions,
          categories: categories.map((c) => ({ id: c.id, name_en: c.name_en })),
          accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
          paymentMethods: paymentMethods.map((p) => ({ id: p.id, name_en: p.name_en })),
          currency,
          range: { startIso: range.startIso, endIso: range.endIso },
        }),
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      downloadBlob(blob, `pocketwise-${range.startIso}_${range.endIso}.${format}`);
    } catch (error) {
      console.error(`${format} export failed`, error);
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
