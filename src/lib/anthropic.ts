import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client for the quick-add natural-language parser.
 * Never import this from a Client Component — ANTHROPIC_API_KEY must stay
 * server-side.
 */
export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY.");
  }
  return new Anthropic({ apiKey });
}

export const QUICK_ADD_MODEL = process.env.ANTHROPIC_QUICK_ADD_MODEL || "claude-haiku-4-5-20251001";
