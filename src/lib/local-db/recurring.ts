import { addDays, addMonths, addWeeks, addYears, formatISO } from "date-fns";
import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import type { RecurringFrequency, RecurringTransaction } from "@/types";

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
 * Local (on-device) port of the old Postgres-backed
 * `generateDueRecurringTransactions` RPC. Generates every transaction due
 * (including catching up on missed runs) for all active
 * `recurringTransactions` rules up to `upToDate`, then advances each rule's
 * `next_run_date` past that point. Safe to call repeatedly — a rule with no
 * due occurrences is a no-op.
 *
 * There's only ever one local user, so unlike the old dual-mode
 * (per-user / cron-sweep-all) function this always processes every active
 * rule on the device.
 */
export async function generateDueRecurringTransactions(
  options: { upToDate?: string } = {},
): Promise<{ rulesProcessed: number; transactionsGenerated: number }> {
  const upToDate = options.upToDate ?? formatISO(new Date(), { representation: "date" });

  const allRules = await db.recurringTransactions.toArray();
  const rulesDue = allRules.filter((rule) => rule.is_active && rule.next_run_date <= upToDate);

  const preferredCurrency =
    (await db.settings.get("singleton"))?.preferredCurrency ?? "MYR";

  let transactionsGenerated = 0;

  for (const rule of rulesDue) {
    let nextRun = rule.next_run_date;
    let lastGenerated = rule.last_generated_date;
    const newTransactionIds: string[] = [];

    while (nextRun <= upToDate && (!rule.end_date || nextRun <= rule.end_date)) {
      const timestamp = nowIso();
      const id = newId();
      await db.transactions.add({
        id,
        user_id: LOCAL_USER_ID,
        type: rule.type,
        amount: rule.amount,
        currency: preferredCurrency,
        category_id: rule.category_id,
        payment_method_id: rule.payment_method_id,
        priority: rule.priority,
        merchant: rule.merchant,
        note: rule.note,
        account_id: rule.account_id,
        to_account_id: rule.to_account_id,
        project_id: null,
        expense_date: nextRun,
        recurring_transaction_id: rule.id,
        tagIds: [],
        created_at: timestamp,
        updated_at: timestamp,
      });
      newTransactionIds.push(id);

      transactionsGenerated += 1;
      lastGenerated = nextRun;
      nextRun = advance(nextRun, rule.frequency, rule.interval_count);
    }

    if (newTransactionIds.length === 0) continue;

    const isEnded = Boolean(rule.end_date && nextRun > rule.end_date);

    await db.recurringTransactions.update(rule.id, {
      next_run_date: nextRun,
      last_generated_date: lastGenerated,
      is_active: isEnded ? false : rule.is_active,
      updated_at: nowIso(),
    } satisfies Partial<RecurringTransaction>);
  }

  return { rulesProcessed: rulesDue.length, transactionsGenerated };
}
