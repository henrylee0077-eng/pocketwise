import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAnthropicClient, QUICK_ADD_MODEL } from "@/lib/anthropic";
import { fetchCategories } from "@/lib/queries/categories";
import { fetchAccountBalances } from "@/lib/queries/accounts";
import { fetchPaymentMethods } from "@/lib/queries/payment-methods";
import { quickAddExtractionSchema, quickAddRequestSchema } from "@/lib/validations";
import { todayIso } from "@/lib/utils";

const TOOL_NAME = "extract_transaction";

const tool = {
  name: TOOL_NAME,
  description: "Extract a structured personal-finance transaction from the user's free-text command.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["expense", "income", "transfer"],
        description:
          "expense = money spent (including credit card purchases charged to a card account); income = money received; transfer = explicitly moving money between two of the user's own named accounts (e.g. 'transfer RM500 from Maybank to HSBC').",
      },
      amount: { type: "number", description: "Positive number, currency symbols/codes stripped." },
      date: { type: "string", description: "yyyy-MM-dd, resolved from relative words like today/yesterday against the reference date given." },
      categoryId: { type: "string", description: "Exact id from the provided category list, or empty string if none fits or type is transfer." },
      accountId: { type: "string", description: "Exact id from the provided account list for the account this affects (or the 'from' account for a transfer), or empty string." },
      toAccountId: { type: "string", description: "Only for transfers: exact id of the destination account, or empty string." },
      paymentMethodId: { type: "string", description: "Exact id from the provided payment method list, or empty string." },
      merchant: { type: "string", description: "Merchant/payee name if mentioned, else empty string." },
      note: { type: "string", description: "Any extra detail worth keeping as a note, else empty string." },
      priority: { type: "string", description: "'high', 'medium', 'low', or empty string if not implied." },
    },
    required: ["type", "amount", "date", "categoryId", "accountId", "toAccountId", "paymentMethodId", "merchant", "note", "priority"],
  },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = quickAddRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const [categories, accounts, paymentMethods] = await Promise.all([
    fetchCategories(supabase),
    fetchAccountBalances(supabase),
    fetchPaymentMethods(supabase),
  ]);

  const categoryList = categories
    .map((c) => `${c.id} :: ${c.name_en} / ${c.name_zh} (${c.type})`)
    .join("\n");
  const accountList = accounts
    .filter((a) => !a.is_archived)
    .map((a) => `${a.id} :: ${a.name} (${a.type})`)
    .join("\n");
  const paymentMethodList = paymentMethods.map((p) => `${p.id} :: ${p.name_en} / ${p.name_zh}`).join("\n");

  const today = todayIso();

  const systemPrompt = `You extract structured personal expense-tracker transactions from short free-text commands, in English or Chinese. The app's currency is Malaysian Ringgit (RM/MYR). Today's reference date is ${today}.

Available categories (id :: name):
${categoryList || "(none)"}

Available accounts (id :: name (type)):
${accountList || "(none)"}

Available payment methods (id :: name):
${paymentMethodList || "(none)"}

Rules:
- "pay credit card X for <purchase>" or "spent RM.. on credit card X" is an EXPENSE charged to account X, NOT a transfer — it increases what the user owes on that card.
- Only use type "transfer" when the user is explicitly moving money between two of their own listed accounts (e.g. paying off a card FROM a bank account, "transfer from A to B").
- Always pick the single best-matching id from the lists above, or an empty string if nothing fits well. Never invent an id that isn't listed.
- Resolve relative dates (today, yesterday, last Monday, etc.) against the reference date.

Call the ${TOOL_NAME} tool with your best extraction.`;

  const anthropic = createAnthropicClient();
  const response = await anthropic.messages.create({
    model: QUICK_ADD_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: body.data.text }],
    tools: [tool],
    tool_choice: { type: "tool", name: TOOL_NAME },
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    return NextResponse.json({ error: "Couldn't understand that — try rephrasing." }, { status: 422 });
  }

  const parsed = quickAddExtractionSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Couldn't understand that — try rephrasing." }, { status: 422 });
  }

  const extraction = parsed.data;

  // Defensive: never trust an id the model returns unless it's actually one
  // we offered — silently drop anything hallucinated rather than crash or
  // save against the wrong row.
  const categoryIds = new Set(categories.map((c) => c.id));
  const accountIds = new Set(accounts.map((a) => a.id));
  const paymentMethodIds = new Set(paymentMethods.map((p) => p.id));
  const priorities = new Set(["high", "medium", "low"]);

  const draft = {
    type: extraction.type,
    amount: extraction.amount,
    date: extraction.date,
    categoryId: categoryIds.has(extraction.categoryId) ? extraction.categoryId : "",
    accountId: accountIds.has(extraction.accountId) ? extraction.accountId : "",
    toAccountId: accountIds.has(extraction.toAccountId) ? extraction.toAccountId : "",
    paymentMethodId: paymentMethodIds.has(extraction.paymentMethodId) ? extraction.paymentMethodId : "",
    merchant: extraction.merchant,
    note: extraction.note,
    priority: priorities.has(extraction.priority) ? extraction.priority : "",
  };

  return NextResponse.json({ draft });
}
