import { GoogleGenAI } from "@google/genai";

/**
 * Server-only Google Gemini client for the quick-add natural-language
 * parser. Never import this from a Client Component — GEMINI_API_KEY must
 * stay server-side.
 */
export function createGoogleAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
}

export const QUICK_ADD_MODEL = process.env.GEMINI_QUICK_ADD_MODEL || "gemini-2.5-flash";
