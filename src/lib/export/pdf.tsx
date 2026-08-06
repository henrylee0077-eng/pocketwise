// PDF report generation. Runs server-side (Node runtime) for the same
// reason as src/lib/export/xlsx.ts — @react-pdf/renderer's browser layout
// engine (yoga-layout, fontkit) doesn't bundle cleanly, while its Node
// entry point (renderToBuffer) works natively. Stateless: the client sends
// its already-loaded local data in the request (see
// src/app/api/export/pdf/route.ts); nothing is persisted here.
import { renderToBuffer } from "@react-pdf/renderer";
import { computeCategoryBreakdown, computeReportSummary, type ReportRange } from "@/lib/reports";
import { ReportDocument } from "@/lib/export/ReportDocument";
import type { Category, TransactionWithTags } from "@/types";

export interface PdfExportContext {
  transactions: TransactionWithTags[];
  categories: Pick<Category, "id" | "name_en">[];
  currency: string;
  range: ReportRange;
}

export async function generateReportPdfBuffer(ctx: PdfExportContext): Promise<Buffer> {
  const { transactions, categories, currency, range } = ctx;

  const categoryNames = new Map(categories.map((c) => [c.id, c.name_en]));
  const summary = computeReportSummary(transactions, range);
  const expenseBreakdown = computeCategoryBreakdown(transactions, "expense");

  return renderToBuffer(
    <ReportDocument
      start={range.startIso}
      end={range.endIso}
      summary={summary}
      expenseBreakdown={expenseBreakdown}
      categoryNames={categoryNames}
      transactions={transactions}
      currency={currency}
    />,
  );
}
