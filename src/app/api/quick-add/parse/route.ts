import { Type } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGoogleAIClient, QUICK_ADD_MODEL } from "@/lib/google-ai";
import { createCategory, fetchCategories } from "@/lib/queries/categories";
import { fetchAccountBalances } from "@/lib/queries/accounts";
import { createPaymentMethod, fetchPaymentMethods } from "@/lib/queries/payment-methods";
import { quickAddExtractionSchema, quickAddRequestSchema } from "@/lib/validations";
import { slugify, todayIso } from "@/lib/utils";

const OTHER_CATEGORY_KEYS = new Set(["others", "other_income"]);

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: ["ready", "needs_clarification"],
      description:
        "'ready' once every required field for this transaction's type is confidently known (see rules below). 'needs_clarification' if any required field is genuinely missing or ambiguous from the conversation so far.",
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
    newCategoryName: {
      type: Type.STRING,
      description:
        "Only when categoryId is empty because the user described a specific category that isn't in the list (e.g. 'pet supplies'): a short, clean category name in the same language the user used, to be created automatically. Empty string otherwise (including whenever categoryId is filled in, or when nothing specific enough has been said yet).",
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
    newPaymentMethodName: {
      type: Type.STRING,
      description:
        "Only when paymentMethodId is empty because the user named a specific payment method/app that isn't in the list (e.g. a newer e-wallet or bank app): a short, clean name for it (same language the user used), to be created automatically. Empty string otherwise.",
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
    "newCategoryName",
    "accountId",
    "toAccountId",
    "paymentMethodId",
    "newPaymentMethodName",
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
    .map((a) => `${a.id} :: ${a.name}${a.institution ? ` / ${a.institution}` : ""} (${a.type})`)
    .join("\n");
  const paymentMethodList = paymentMethods.map((p) => `${p.id} :: ${p.name_en} / ${p.name_zh}`).join("\n");

  const today = todayIso();

  const systemInstruction = `You extract structured personal expense-tracker transactions from a short conversation, in English or Chinese. The app's currency is Malaysian Ringgit (RM/MYR). Today's reference date is ${today}.

Available categories (id :: name):
${categoryList || "(none)"}

Available accounts (id :: name / institution (type)):
${accountList || "(none)"}

Available payment methods (id :: name):
${paymentMethodList || "(none)"}

This is a multi-turn conversation. The user's first message is a command like "today lunch RM20" or "pay HSBC credit card RM200.40 for a bag". Once every required field below is confidently known, set status to "ready" — the app will save it immediately with no further confirmation, so only mark "ready" when every required field is actually filled in. Otherwise set status to "needs_clarification" and ask exactly ONE short, specific, friendly question about the single most important missing field. The user's next message will answer that question — use the whole conversation so far to fill in the final transaction.

Required fields before status can be "ready":
- expense: amount, category, merchant, payment method, AND date — all five.
- income: amount, category, merchant, payment method, AND date — all five.
- transfer: amount, source account, AND destination account.
- account is NOT in this required list — it's optional — EXCEPT when the user actually named one, in which case see the account-matching rule below (resolve it or ask, don't just skip it).

Rules:
- "pay credit card X for <purchase>" or "spent RM.. on credit card X" is an EXPENSE charged to account X, NOT a transfer — it increases what the user owes on that card.
- Only use type "transfer" when the user is explicitly moving money between two of their own listed accounts.
- Always pick the single best-matching id from the lists above, or an empty string if nothing fits well. Never invent an id that isn't listed.
- Resolve relative dates (today, yesterday, last Monday, etc.) against the reference date; default to the reference date if no date is mentioned — date is the one required field that's satisfied by this default, so only ask about it if the user's phrasing is genuinely ambiguous (e.g. "the 30th" with no clear month).
- For expense/income, merchant and payment method must be explicit or clearly implied by the conversation — do NOT default or guess them silently. If either is missing, ask about it.
- Category matching: do NOT settle for the generic "Others" (expense) or "Other Income" (income) catch-all just because nothing in the list is a perfect match. If the user's own words name or clearly imply a specific category that isn't in the list (e.g. "pet food", "gym membership", "宠物用品"), leave categoryId empty and instead put a short, clean category name for it (singular, same language the user used) in newCategoryName — treat this as resolved (do not ask a clarifying question just for this; the app will create the category automatically). Only actually use the "Others"/"Other Income" id (with newCategoryName left empty) when the user is genuinely vague about what it even is, or explicitly says something like "other"/"misc"/"其他".
- Exception: if the resolved category ends up being the "Others"/"Other Income" catch-all itself, merchant is OPTIONAL — do not ask for it in that case, an empty merchant is fine.
- Payment method matching: match common Malaysian payment rails and their nicknames/abbreviations to the closest listed payment method — e.g. "TNG", "Touch n Go", "touch and go ewallet" → Touch 'n Go eWallet; "grab pay", "grabpay" → GrabPay; "shopee pay", "spay" → ShopeePay; "duitnow qr", "duit now" → DuitNow; "cheque", "check" → Cheque. If the user names a specific payment method/app that genuinely isn't in the list (e.g. a bank's own app, a newer e-wallet), leave paymentMethodId empty and put a short, clean name for it in newPaymentMethodName instead of asking — the app will create it automatically, same as an unlisted category.
- Account matching (expense/income too, not just transfers): if the user names a wallet/bank/account — by its account name OR its institution (e.g. "Maybank", "into my HSBC account", "TNG wallet balance") — match it against the accounts list (name and institution are both shown) and set accountId, even though account isn't in the strict required-fields list below. This is what makes that specific account's balance actually reflect the transaction, so try hard to resolve it whenever one is mentioned. If the user clearly named an account/bank that doesn't match anything in the list, do NOT silently drop it and do NOT invent a new account (unlike categories/payment methods, an account can't be safely auto-created — it needs a type and starting balance only the user can set up in Settings). Instead ask a short clarifying question naming the closest existing accounts, e.g. "I don't have an account called X — did you mean one of: <list>, or should this not be tied to a specific account?" If the user says no specific account / just cash in hand / doesn't answer meaningfully, leave accountId empty and proceed — it's optional when genuinely not mentioned. Note that accountId and paymentMethodId are independent fields, not either/or — a transaction can (and for cards/e-wallets with a matching account, should) have both set at once.
- Credit card charges must be tied to a specific card account, not just the generic "Credit Card" payment method alone — a real charge always hits exactly one card's available limit, so a credit card expense with no linked account can't actually be tracked. If the user says "credit card" (or similar) without naming which one: when only one credit_card-type account exists in the accounts list, set accountId to it automatically; when more than one exists, ask which card by name (e.g. "Which card — Maybank Credit Card or HSBC Credit Card?") instead of marking status ready. If the user does name a specific card, resolve it via the normal account-matching rule above as usual.
- Never ask more than one question per turn. Priority and note are always optional — never ask about those.

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

  // If the model couldn't match an existing category but the user named a
  // specific one in their own words, create it automatically instead of
  // falling back to Others/Other Income — this is the user's escape hatch
  // for "I want to add another category" without a separate trip to
  // Settings. Match against existing categories first (by key or name) so
  // repeated use of the same new category doesn't create duplicates.
  const trimmedNewCategoryName = extraction.newCategoryName.trim();
  if (draft.type !== "transfer" && !draft.categoryId && trimmedNewCategoryName) {
    const categoryType = draft.type;
    const candidateKey = slugify(trimmedNewCategoryName);
    const existingMatch = categories.find(
      (c) =>
        c.type === categoryType &&
        (c.key === candidateKey ||
          c.name_en.toLowerCase() === trimmedNewCategoryName.toLowerCase() ||
          c.name_zh === trimmedNewCategoryName),
    );
    if (existingMatch) {
      draft.categoryId = existingMatch.id;
    } else {
      try {
        const created = await createCategory(supabase, user.id, {
          type: categoryType,
          nameEn: trimmedNewCategoryName,
          nameZh: trimmedNewCategoryName,
          icon: "Tag",
          color: "#6B7280",
          isEssential: true,
        });
        draft.categoryId = created.id;
      } catch (error) {
        console.error("quick-add auto-create category failed", error);
        // Fall through — categoryId stays empty, the check below will ask.
      }
    }
  }

  // Same escape hatch for payment methods: if the user named a specific
  // rail/app that isn't in the list (system defaults now cover the common
  // Malaysian ones — cash, cards, bank transfer, cheque, Touch 'n Go
  // eWallet, GrabPay, ShopeePay, Boost, DuitNow — plus generic E-Wallet),
  // create a custom one instead of forcing a generic bucket or looping on
  // a clarifying question.
  const trimmedNewPaymentMethodName = extraction.newPaymentMethodName.trim();
  if (draft.type !== "transfer" && !draft.paymentMethodId && trimmedNewPaymentMethodName) {
    const candidateKey = slugify(trimmedNewPaymentMethodName);
    const existingMatch = paymentMethods.find(
      (p) =>
        p.key === candidateKey ||
        p.name_en.toLowerCase() === trimmedNewPaymentMethodName.toLowerCase() ||
        p.name_zh === trimmedNewPaymentMethodName,
    );
    if (existingMatch) {
      draft.paymentMethodId = existingMatch.id;
    } else {
      try {
        const created = await createPaymentMethod(supabase, user.id, {
          nameEn: trimmedNewPaymentMethodName,
          nameZh: trimmedNewPaymentMethodName,
          icon: "Smartphone",
        });
        draft.paymentMethodId = created.id;
      } catch (error) {
        console.error("quick-add auto-create payment method failed", error);
        // Fall through — paymentMethodId stays empty, the check below will ask.
      }
    }
  }

  // A credit card charge that isn't tied to a specific card account can't
  // actually be tracked (nowhere to deduct the limit from) — so if payment
  // resolved to the generic "Credit Card" method and no account is linked
  // yet, resolve or ask deterministically, regardless of what the model did.
  if (draft.type !== "transfer" && !draft.accountId) {
    const resolvedPaymentMethod = paymentMethods.find((p) => p.id === draft.paymentMethodId);
    if (resolvedPaymentMethod?.key === "credit_card") {
      const creditCardAccounts = accounts.filter((a) => a.type === "credit_card" && !a.is_archived);
      const [onlyCreditCardAccount] = creditCardAccounts;
      if (creditCardAccounts.length === 1 && onlyCreditCardAccount) {
        draft.accountId = onlyCreditCardAccount.id;
      } else if (creditCardAccounts.length > 1) {
        return NextResponse.json({
          status: "needs_clarification",
          question: `Which credit card — ${creditCardAccounts.map((a) => a.name).join(", ")}?`,
        });
      }
      // Zero credit card accounts set up: nothing to link to, proceed without one.
    }
  }

  // Final sanity check even after the model said "ready" — if id resolution
  // dropped something essential (or the model was overconfident), ask
  // rather than silently save an incomplete transaction. Checked in a fixed
  // order so only one question is ever asked per turn.
  if (draft.type === "transfer") {
    if (!draft.accountId || !draft.toAccountId) {
      return NextResponse.json({
        status: "needs_clarification",
        question: "Which two accounts should this transfer be between?",
      });
    }
  } else {
    if (!draft.categoryId) {
      return NextResponse.json({
        status: "needs_clarification",
        question: "Which category should this go under?",
      });
    }
    if (!draft.paymentMethodId) {
      return NextResponse.json({
        status: "needs_clarification",
        question: "How did you pay for this — cash, debit, credit card, e-wallet, or bank transfer?",
      });
    }
    // "Others" / "Other Income" are catch-all buckets by design, so a
    // merchant name is optional there rather than a required field.
    const resolvedCategory = categories.find((c) => c.id === draft.categoryId);
    const isCatchAllCategory = resolvedCategory ? OTHER_CATEGORY_KEYS.has(resolvedCategory.key) : false;
    if (!isCatchAllCategory && !draft.merchant.trim()) {
      return NextResponse.json({
        status: "needs_clarification",
        question: "Who was this with, or where — the merchant or payee name?",
      });
    }
  }

  return NextResponse.json({ status: "ready", draft });
}
