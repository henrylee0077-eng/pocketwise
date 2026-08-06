// Thin adapter over src/lib/local-db/security.ts, kept at this import path
// so hooks/use-security.ts didn't need to change where it imports from.
// `fetchProfile` maps the local settings record into the same
// snake_case `Profile` shape the app already had components built
// against, so nothing downstream needed to change field names.
import {
  clearPin as clearPinLocal,
  fetchSettings,
  resetAccount as resetAccountLocal,
  setPin as setPinLocal,
  setPreferredCurrency as setPreferredCurrencyLocal,
  verifyPin as verifyPinLocal,
  type VerifyPinResult,
} from "@/lib/local-db/security";
import type { Profile } from "@/types";

export type { VerifyPinResult };

export async function fetchProfile(): Promise<Profile> {
  const settings = await fetchSettings();
  return {
    id: "local-device-owner",
    display_name: settings.displayName,
    avatar_url: settings.avatarUrl,
    preferred_language: settings.preferredLanguage,
    preferred_currency: settings.preferredCurrency,
    household_id: null,
    pin_enabled: settings.pinEnabled,
    created_at: settings.createdAt,
    updated_at: settings.updatedAt,
  };
}

export const setPin = setPinLocal;
export const verifyPin = verifyPinLocal;
export const clearPin = clearPinLocal;
export const resetAccount = resetAccountLocal;
export const setPreferredCurrency = setPreferredCurrencyLocal;
