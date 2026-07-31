import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateDueRecurringTransactions } from "@/lib/recurring-engine";

export const dynamic = "force-dynamic";

/**
 * Invoked daily by Vercel Cron (see vercel.json). Vercel automatically sends
 * `Authorization: Bearer $CRON_SECRET` on cron-triggered requests when the
 * CRON_SECRET env var is set, so we verify that here to stop anyone else
 * from triggering a sweep across every user's account.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateDueRecurringTransactions(createServiceClient());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("generate-recurring cron failed", error);
    return NextResponse.json({ ok: false, error: "Generation failed" }, { status: 500 });
  }
}
