import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDueRecurringTransactions } from "@/lib/recurring-engine";

/**
 * "Generate now" button — runs as the signed-in user via the normal RLS-
 * scoped client, so it can only ever touch that user's own recurring rules
 * and transactions. Doesn't need the service-role key.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateDueRecurringTransactions(supabase, { userId: user.id });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("generate-recurring (manual) failed", error);
    return NextResponse.json({ ok: false, error: "Generation failed" }, { status: 500 });
  }
}
