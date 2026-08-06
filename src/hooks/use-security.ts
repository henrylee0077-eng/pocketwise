"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import {
  clearPin,
  fetchProfile,
  resetAccount,
  setPin,
  setPreferredCurrency,
  verifyPin,
  type VerifyPinResult,
} from "@/lib/queries/security";

const UNLOCK_KEY = "pocketwise:unlocked";

export function useProfile() {
  return useLocalQuery(() => fetchProfile(), []);
}

export function useSetPin() {
  return useMutation({
    mutationFn: (pin: string) => setPin(pin),
  });
}

/**
 * Wraps verifyPin. A wrong PIN is a normal *result* (ok: false), not a
 * thrown error — only genuine failures (e.g. no PIN set) reject.
 */
export function useVerifyPin() {
  return useMutation<VerifyPinResult, Error, string>({
    mutationFn: (pin: string) => verifyPin(pin),
  });
}

export function useClearPin() {
  return useMutation({
    mutationFn: () => clearPin(),
  });
}

export function useResetAccount() {
  return useMutation({
    mutationFn: () => resetAccount(),
  });
}

export function useSetPreferredCurrency() {
  return useMutation({
    mutationFn: (currencyCode: string) => setPreferredCurrency(currencyCode),
  });
}

/**
 * Drives the app-lock gate. There's no more "signed in or not" concept —
 * every device has exactly one local user — so `locked` now depends only
 * on whether a PIN is set and whether this tab/session has already been
 * unlocked. The unlock flag lives in sessionStorage, cleared when the
 * tab/installed PWA is fully closed, so reopening the app always
 * re-prompts, but backgrounding it briefly doesn't.
 */
export function usePinLock() {
  const { data: profile, isLoading: profileLoading, isFetched: profileFetched } = useProfile();
  const [unlocked, setUnlocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration-safe read of sessionStorage, not a sync loop
    setUnlocked(window.sessionStorage.getItem(UNLOCK_KEY) === "1");
    setHydrated(true);
  }, []);

  const markUnlocked = useCallback(() => {
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
    setUnlocked(true);
  }, []);

  const pinEnabled = profile?.pin_enabled ?? false;
  const ready = hydrated && (profileFetched || !profileLoading);
  const locked = ready && pinEnabled && !unlocked;

  return { locked, ready, markUnlocked };
}
