import { Type } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGoogleAIClient, QUICK_ADD_MODEL } from "@/lib/google-ai";
import { fetchCategories } from "@/lib/queries/categories";
import { fetchAccountBalances } from "@/lib/queries/accounts";
import { fetchPaymentMethods } from "@/lib/queries/payment-methods";
import { quickAddExtractionSchema, quickAddRequestSchema } from "@/lib/validations";
import { todayIso } from "@/lib/utils";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: ["ready", "needs_clarification"],
      description:
        "'ready' once you're confident about the amount and (for expense/income) a category, or (for transfer) both accounts. 'needs_clarification' if any of that is genuinely missing or ambiguous from the conversation so far.",
    },
    clarifyingQuestion: {
      type: Type.STRING,
      description: "One short, friendly question to ask the user. Only used when status is needs_clarification, else empty string.",
    },
    type: {
      type: Type.STRING,
      enum: ["expense", "income", "transfer"],
      description:
        "expense = money spent (including credit card purchases charged to a card account); income = money received; transfer = explicitly moving money between two of the user's own named accounts (e.g. 'transfer RM500 from Maybank to HSBC').",
    },
    amount: { type: Type.NUMBER, description: "Positive number, currency symbols/codes stripped. 0 if not yet known." },
    date: {
      type: Type.STRING,
      description:
        "yyyy-MM-dd, resolved from relative words like today/yesterday against the reference date given. Default to the reference date if unspecified.",
    },
    categoryId: {
      type: Type.STRING,
      description: "Exact id from the provided category list, or empty string if none fits or type is transfer.",
    },
    accountId: {
      type: Type.STRING,
      description:
        "Exact id from the provided account list for the account this affects (or the 'from' account for a transfer), or empty string.",
    },
    toAccountId: {
      type: Type.STRING,
      description: "Only for transfers: exact id of the destination account, or empty string.",
    },
    paymentMethodId: {
      type: Type.STRING,
      description: "Exact id from the provided payment method list, or empty string.",
    },
    merchant: { type: Type.STRING, description: "Merchant/payee name if mentioned, else empty string." },
    note: { type: Type.STRING, description: "Any extra detail worth keeping as a note, else empty string." },
    priority: { type: Type.STRING, description: "'high', 'medium', 'low', or empty string if not implied." },
  },
  required: [
    "status",
    "clarifyingQuestion",
    "type",
    "amount",
    "date",
    "categoryId",
    "accountId",
    "toAccountId",
    "paymentMethodId",
    "merchant",
    "note",
    "priority",
  ],
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

  const systemInstruction = `You extract structured personal expense-tracker transactions from a short conversation, in English or Chinese. The app's currency is Malaysian Ringgit (RM/MYR). Today's reference date is ${today}.

Available categories (id :: name):
${categoryList || "(none)"}

Available accounts (id :: name (type)):
${accountList || "(none)"}

Available payment methods (id :: name):
${paymentMethodList || "(none)"}

This is a multi-turn conversation. The user's first message is a command like "today lunch RM20" or "pay HSBC credit card RM200.40 for a bag". If you already have enough to record a sensible transaction, set status to "ready" — the app will save it immediately with no further confirmation, so only mark "ready" when you're actually confident. If something essential is missing or ambiguous (usually the amount, or which category/account it belongs to), set status to "needs_clarification" and ask exactly ONE short, specific, friendly question. The user's next message will answer that question — use the whole conversation so far to fill in the final transaction.

Rules:
- "pay credit card X for <purchase>" or "spent RM.. on credit card X" is an EXPENSE charged to account X, NOT a transfer — it increases what the user owes on that card.
- Only use type "transfer" when the user is explicitly moving money between two of their own listed accounts.
- Always pick the single best-matching id from the lists above, or an empty string if nothing fits well. Never invent an id that isn't listed.
- Resolve relative dates (today, yesterday, last Monday, etc.) against the reference date; default to the reference date if no date is mentioned.
- Never ask more than one question per turn, and never ask about fields that already have a sensible default (date, priority, merchant, note, payment method) — only ask about amount or category/account when truly unclear.

Respond only with JSON matching the schema.`;

  const ai = createGoogleAIClient();
  let rawJson: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model: QUICK_ADD_MODEL,
      contents: body.data.turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    });
    rawJson = response.text;
  } catch (error) {
    console.error("quick-add Gemini call failed", error);
    return NextResponse.json({ error: "Couldn't understand that — try rephrasing." }, { status: 502 });
  }

  if (!rawJson) {
    return NextResponse.json({ error: "Couldn't understand that — try rephrasing." }, { status: 422 });
  }

  let extractedJson: unknown;
  try {
    extractedJson = JSON.parse(rawJson);
  } catch {
    return NextResponse.json({ error: "Couldn't understand that — try rephrasing." }, { status: 422 });
  }

  const parsed = quickAddExtractionSchema.safeParse(extractedJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Couldn't understand that — try rephrasing." }, { status: 422 });
  }

  const extraction = parsed.data;

  if (extraction.status === "needs_clarification") {
    return NextResponse.json({
      status: "needs_clarification",
      question: extraction.clarifyingQuestion || "Could you give me a bit more detail?",
    });
  }

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

  // Final sanity check even after the model said "ready" — if id resolution
  // dropped something essential, ask rather than silently save a broken
  // transaction.
  if (draft.type === "transfer") {
    if (!draft.accountId || !draft.toAccountId) {
      return NextResponse.json({
        status: "needs_clarification",
        question: "Which two accounts should this transfer be between?",
      });
    }
  } else if (!draft.categoryId) {
    return NextResponse.json({
      status: "needs_clarification",
      question: "Which category should this go under?",
    });
  }

  return NextResponse.json({ status: "ready", draft });
}
