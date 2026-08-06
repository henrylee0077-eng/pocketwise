// Excel report generation. Runs server-side (Node runtime) — see
// src/app/api/export/xlsx/route.ts for why this can't run on-device.
// Stateless: the client sends its already-loaded local data in the
// request body and nothing is persisted here, same trade-off already made
// for Quick Add's Gemini call.
//
// Uses `write-excel-file` instead of the more popular `exceljs`: exceljs
// pulls in a chain of legacy Node packages (archiver, glob,
// readable-stream@1, ...) for .zip handling that failed to resolve during
// a real production build on Windows (deeply nested node_modules paths).
// write-excel-file uses `fflate` for zip compression instead — a small,
// dependency-free library — and has no such issue.
import writeXlsxFile from "write-excel-file/node";
import { computeCategoryBreakdown, computeReportSummary, type ReportRange } from "@/lib/reports";
import type { Category, PaymentMethod, TransactionWithTags } from "@/types";

function typeLabel(type: string) {
  if (type === "income") return "Income";
  if (type === "transfer") return "Transfer";
  return "Expense";
}

export interface ExportContext {
  transactions: TransactionWithTags[];
  categories: Pick<Category, "id" | "name_en">[];
  accounts: { id: string; name: string }[];
  paymentMethods: Pick<PaymentMethod, "id" | "name_en">[];
  currency: string;
  range: ReportRange;
}

interface Cell {
  value: string | number;
  type?: NumberConstructor;
  fontWeight?: "bold";
}
type SheetRow = Cell[];

const bold = (value: string): Cell => ({ value, fontWeight: "bold" });

export async function generateTransactionsWorkbookBuffer(ctx: ExportContext): Promise<Buffer> {
  const { transactions, categories, accounts, paymentMethods, currency, range } = ctx;

  const categoryMap = new Map(categories.map((c) => [c.id, c.name_en]));
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const paymentMethodMap = new Map(paymentMethods.map((p) => [p.id, p.name_en]));

  const summary = computeReportSummary(transactions, range);
  const expenseBreakdown = computeCategoryBreakdown(transactions, "expense");

  const summaryRows: SheetRow[] = [
    [bold("PocketWise Report"), { value: `${range.startIso} to ${range.endIso}` }],
    [],
    [{ value: "Total income" }, { value: summary.totalIncome, type: Number }],
    [{ value: "Total expense" }, { value: summary.totalExpense, type: Number }],
    [{ value: "Net" }, { value: summary.net, type: Number }],
    [{ value: "Transactions" }, { value: summary.transactionCount, type: Number }],
    [{ value: "Average expense / day" }, { value: Number(summary.avgExpensePerDay.toFixed(2)), type: Number }],
    [],
    [bold("Top expense categories")],
    ...expenseBreakdown
      .slice(0, 10)
      .map(
        (entry): SheetRow => [
          { value: categoryMap.get(entry.categoryId) ?? "—" },
          { value: entry.total, type: Number },
        ],
      ),
  ];

  const txHeader: SheetRow = [
    bold("Date"),
    bold("Type"),
    bold("Category"),
    bold(`Amount (${currency})`),
    bold("Account"),
    bold("To Account"),
    bold("Payment Method"),
    bold("Priority"),
    bold("Merchant"),
    bold("Note"),
  ];

  const txRows: SheetRow[] = [
    txHeader,
    ...transactions.map(
      (t): SheetRow => [
        { value: t.expense_date },
        { value: typeLabel(t.type) },
        { value: t.category_id ? (categoryMap.get(t.category_id) ?? "—") : "—" },
        { value: Number(t.amount), type: Number },
        { value: t.account_id ? (accountMap.get(t.account_id) ?? "—") : "" },
        { value: t.to_account_id ? (accountMap.get(t.to_account_id) ?? "—") : "" },
        { value: t.payment_method_id ? (paymentMethodMap.get(t.payment_method_id) ?? "—") : "" },
        { value: t.priority ?? "" },
        { value: t.merchant ?? "" },
        { value: t.note ?? "" },
      ],
    ),
  ];

  return writeXlsxFile(
    [
      { data: summaryRows, sheet: "Summary", columns: [{ width: 28 }, { width: 20 }] },
      {
        data: txRows,
        sheet: "Transactions",
        columns: [
          { width: 12 },
          { width: 10 },
          { width: 20 },
          { width: 14 },
          { width: 18 },
          { width: 18 },
          { width: 16 },
          { width: 10 },
          { width: 20 },
          { width: 30 },
        ],
        stickyRowsCount: 1,
      },
    ],
  ).toBuffer();
}
