import { NextResponse } from "next/server";
import { z } from "zod";
import { generateReportPdfBuffer } from "@/lib/export/pdf";
import { exportRequestSchema } from "@/lib/validations";

export const runtime = "nodejs";

/** Stateless, same reasoning as src/app/api/export/xlsx/route.ts. */
export async function POST(request: Request) {
  const parsed = exportRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }

  const { range, transactions, categories, currency } = parsed.data;

  try {
    const buffer = await generateReportPdfBuffer({
      transactions,
      categories,
      currency,
      range: { ...range, start: new Date(`${range.startIso}T00:00:00`), end: new Date(`${range.endIso}T00:00:00`) },
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="pocketwise-${range.startIso}_${range.endIso}.pdf"`,
      },
    });
  } catch (error) {
    console.error("pdf export failed", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
