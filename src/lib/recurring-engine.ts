import { addDays, addMonths, addWeeks, addYears, formatISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { RecurringFrequency } from "@/types";

function advance(dateIso: string, frequency: RecurringFrequency, intervalCount: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  const next =
    frequency === "daily"
      ? addDays(date, intervalCount)
      : frequency === "weekly"
        ? addWeeks(date, intervalCount)
        : frequency === "monthly"
          ? addMonths(date, intervalCount)
          : addYears(date, intervalCount);
  return formatISO(next, { representation: "date" });
}

/**
 * Generates every transaction due (including catching up on missed runs) for
 * all active recurring_transactions rules up to `upToDate`, then advances
 * each rule's next_run_date past that point. Safe to call repeatedly — a
 * rule with no due occurrences is a no-op.
 *
 * Pass `userId` to scope to one user (used by the authenticated "generate
 * now" action); omit it to sweep every user (used by the cron job, which
 * runs with a service-role client that bypasses RLS).
 */
export async function generateDueRecurringTransactions(
  supabase: SupabaseClient<Database>,
  options: { upToDate?: string; userId?: string } = {},
): Promise<{ rulesProcessed: number; transactionsGenerated: number }> {
  const upToDate = options.upToDate ?? formatISO(new Date(), { representation: "date" });

  let query = supabase.from("recurring_transactions").select("*").eq("is_active", true).lte(
    "next_run_date",
    upToDate,
  );
  if (options.userId) query = query.eq("user_id", options.userId);

  const { data: dueRules, error } = await query;
  if (error) throw error;

  let transactionsGenerated = 0;

  for (const rule of dueRules ?? []) {
    let nextRun = rule.next_run_date;
    let lastGenerated = rule.last_generated_date;

    while (nextRun <= upToDate && (!rule.end_date || nextRun <= rule.end_date)) {
      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: rule.user_id,
        type: rule.type,
        amount: rule.amount,
        category_id: rule.category_id,
        payment_method_id: rule.payment_method_id,
        priority: rule.priority,
        merchant: rule.merchant,
        note: rule.note,
        account_id: rule.account_id,
        to_account_id: rule.to_account_id,
        expense_date: nextRun,
        recurring_transaction_id: rule.id,
      });
      if (insertError) throw insertError;

      transactionsGenerated += 1;
      lastGenerated = nextRun;
      nextRun = advance(nextRun, rule.frequency, rule.interval_count);
    }

    const isEnded = Boolean(rule.end_date && nextRun > rule.end_date);

    const { error: updateError } = await supabase
      .from("recurring_transactions")
      .update({
        next_run_date: nextRun,
        last_generated_date: lastGenerated,
        is_active: isEnded ? false : rule.is_active,
      })
      .eq("id", rule.id);
    if (updateError) throw updateError;
  }

  return { rulesProcessed: dueRules?.length ?? 0, transactionsGenerated };
}
