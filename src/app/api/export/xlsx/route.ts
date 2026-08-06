import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTransactionsWorkbookBuffer } from "@/lib/export/xlsx";
import { exportRequestSchema } from "@/lib/validations";

/**
 * Stateless — PocketWise's data lives on-device (see src/lib/local-db),
 * not in a database this route can query. The client sends its own
 * already-loaded transactions/categories/accounts/payment methods for the
 * selected range; this route only runs the xlsx generator (which needs a
 * Node runtime — see src/lib/export/xlsx.ts) and returns the generated
 * file. Nothing is persisted here.
 */
export async function POST(request: Request) {
  const parsed = exportRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }

  const { range, ...ctx } = parsed.data;

  try {
    const buffer = await generateTransactionsWorkbookBuffer({
      ...ctx,
      range: { ...range, start: new Date(`${range.startIso}T00:00:00`), end: new Date(`${range.endIso}T00:00:00`) },
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="pocketwise-${range.startIso}_${range.endIso}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("xlsx export failed", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
