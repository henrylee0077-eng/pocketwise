import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Profile } from "@/types";

/**
 * Result shape returned by the `verify_pin` Postgres function. All PIN
 * hashing/comparison happens server-side inside Postgres (pgcrypto) — the
 * client never sees a hash, only this outcome.
 */
export interface VerifyPinResult {
  ok: boolean;
  reason?: "not_set" | "locked" | "incorrect";
  attemptsRemaining?: number;
  lockedUntil?: string;
}

export async function fetchProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    // Deliberately not `select("*")` — pin_hash isn't in the TS Row type,
    // but being explicit here keeps the security intent obvious in code.
    .select("id, display_name, avatar_url, preferred_language, preferred_currency, household_id, pin_enabled, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function setPin(supabase: SupabaseClient<Database>, pin: string): Promise<void> {
  const { error } = await supabase.rpc("set_pin", { new_pin: pin });
  if (error) throw error;
}

export async function verifyPin(
  supabase: SupabaseClient<Database>,
  pin: string,
): Promise<VerifyPinResult> {
  const { data, error } = await supabase.rpc("verify_pin", { candidate: pin });
  if (error) throw error;
  return data as unknown as VerifyPinResult;
}

export async function clearPin(supabase: SupabaseClient<Database>): Promise<void> {
  const { error } = await supabase.rpc("clear_pin");
  if (error) throw error;
}

export async function resetAccount(supabase: SupabaseClient<Database>): Promise<void> {
  const { error } = await supabase.rpc("reset_my_account");
  if (error) throw error;
}

export async function setPreferredCurrency(
  supabase: SupabaseClient<Database>,
  currencyCode: string,
): Promise<void> {
  const { error } = await supabase.rpc("set_preferred_currency", { new_currency: currencyCode });
  if (error) throw error;
}
