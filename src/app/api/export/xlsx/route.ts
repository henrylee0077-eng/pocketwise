import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTransactionsForRange } from "@/lib/queries/transactions";
import { computeCategoryBreakdown, computeReportSummary } from "@/lib/reports";

function typeLabel(type: string) {
  if (type === "income") return "Income";
  if (type === "transfer") return "Transfer";
  return "Expense";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "Missing start/end date" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [transactions, categoriesRes, accountsRes, paymentMethodsRes, profileRes] = await Promise.all([
    fetchTransactionsForRange(supabase, { start, end }),
    supabase.from("categories").select("id, name_en, color"),
    supabase.from("accounts").select("id, name"),
    supabase.from("payment_methods").select("id, name_en"),
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).single(),
  ]);

  const categoryMap = new Map((categoriesRes.data ?? []).map((c) => [c.id, c.name_en]));
  const accountMap = new Map((accountsRes.data ?? []).map((a) => [a.id, a.name]));
  const paymentMethodMap = new Map((paymentMethodsRes.data ?? []).map((p) => [p.id, p.name_en]));
  const currency = profileRes.data?.preferred_currency ?? "MYR";

  const range = { start: new Date(`${start}T00:00:00`), end: new Date(`${end}T00:00:00`), startIso: start, endIso: end };
  const summary = computeReportSummary(transactions, range);
  const expenseBreakdown = computeCategoryBreakdown(transactions, "expense");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PocketWise";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [{ width: 28 }, { width: 20 }];
  summarySheet.addRow(["PocketWise Report", `${start} to ${end}`]).font = { bold: true, size: 14 };
  summarySheet.addRow([]);
  summarySheet.addRow(["Total income", summary.totalIncome]);
  summarySheet.addRow(["Total expense", summary.totalExpense]);
  summarySheet.addRow(["Net", summary.net]);
  summarySheet.addRow(["Transactions", summary.transactionCount]);
  summarySheet.addRow(["Average expense / day", Number(summary.avgExpensePerDay.toFixed(2))]);
  summarySheet.addRow([]);
  summarySheet.addRow(["Top expense categories", ""]).font = { bold: true };
  for (const entry of expenseBreakdown.slice(0, 10)) {
    summarySheet.addRow([categoryMap.get(entry.categoryId) ?? "—", entry.total]);
  }

  const txSheet = workbook.addWorksheet("Transactions");
  txSheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Type", key: "type", width: 10 },
    { header: "Category", key: "category", width: 20 },
    { header: `Amount (${currency})`, key: "amount", width: 14 },
    { header: "Account", key: "account", width: 18 },
    { header: "To Account", key: "toAccount", width: 18 },
    { header: "Payment Method", key: "paymentMethod", width: 16 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Merchant", key: "merchant", width: 20 },
    { header: "Note", key: "note", width: 30 },
  ];
  txSheet.getRow(1).font = { bold: true };

  for (const t of transactions) {
    txSheet.addRow({
      date: t.expense_date,
      type: typeLabel(t.type),
      category: t.category_id ? (categoryMap.get(t.category_id) ?? "—") : "—",
      amount: Number(t.amount),
      account: t.account_id ? (accountMap.get(t.account_id) ?? "—") : "",
      toAccount: t.to_account_id ? (accountMap.get(t.to_account_id) ?? "—") : "",
      paymentMethod: t.payment_method_id ? (paymentMethodMap.get(t.payment_method_id) ?? "—") : "",
      priority: t.priority ?? "",
      merchant: t.merchant ?? "",
      note: t.note ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pocketwise-${start}_${end}.xlsx"`,
    },
  });
}
