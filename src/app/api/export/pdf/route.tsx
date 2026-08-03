import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTransactionsForRange } from "@/lib/queries/transactions";
import { computeCategoryBreakdown, computeReportSummary } from "@/lib/reports";
import { ReportDocument } from "./ReportDocument";

export const runtime = "nodejs";

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

  const [transactions, categoriesRes, profileRes] = await Promise.all([
    fetchTransactionsForRange(supabase, { start, end }),
    supabase.from("categories").select("id, name_en"),
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).single(),
  ]);

  const categoryNames = new Map((categoriesRes.data ?? []).map((c) => [c.id, c.name_en]));
  const currency = profileRes.data?.preferred_currency ?? "MYR";
  const range = { start: new Date(`${start}T00:00:00`), end: new Date(`${end}T00:00:00`), startIso: start, endIso: end };
  const summary = computeReportSummary(transactions, range);
  const expenseBreakdown = computeCategoryBreakdown(transactions, "expense");

  const buffer = await renderToBuffer(
    <ReportDocument
      start={start}
      end={end}
      summary={summary}
      expenseBreakdown={expenseBreakdown}
      categoryNames={categoryNames}
      transactions={transactions}
      currency={currency}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pocketwise-${start}_${end}.pdf"`,
    },
  });
}
