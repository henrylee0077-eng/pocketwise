"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  clearPin,
  fetchProfile,
  resetAccount,
  setPin,
  verifyPin,
  type VerifyPinResult,
} from "@/lib/queries/security";

const UNLOCK_KEY = "pocketwise:unlocked";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(createClient(), user!.id),
    enabled: !!user,
  });
}

export function useSetPin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pin: string) => setPin(createClient(), pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

/**
 * Wraps verify_pin. A wrong PIN is a normal *result* (ok: false), not a
 * thrown error — only genuine failures (not authenticated, network error)
 * reject the mutation.
 */
export function useVerifyPin() {
  return useMutation<VerifyPinResult, Error, string>({
    mutationFn: (pin: string) => verifyPin(createClient(), pin),
  });
}

export function useClearPin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearPin(createClient()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

export function useResetAccount() {
  return useMutation({
    mutationFn: () => resetAccount(createClient()),
  });
}

/**
 * Drives the app-lock gate. `locked` is true once we know (a) there's an
 * authenticated user, (b) their profile has a PIN set, and (c) this browser
 * tab/session hasn't already been unlocked. The unlock flag lives in
 * sessionStorage — cleared when the tab/installed PWA is fully closed, so
 * reopening the app always re-prompts, but backgrounding it briefly doesn't.
 */
export function usePinLock() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading, isFetched: profileFetched } = useProfile();
  const [unlocked, setUnlocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration-safe read of sessionStorage, not a sync loop
    setUnlocked(window.sessionStorage.getItem(UNLOCK_KEY) === "1");
    setHydrated(true);
  }, []);

  // Signed out (or switched account) on this tab — never trust a stale
  // unlock flag from a previous session.
  useEffect(() => {
    if (!authLoading && !user) {
      window.sessionStorage.removeItem(UNLOCK_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to an external auth-state change, not a render loop
      setUnlocked(false);
    }
  }, [authLoading, user]);

  const markUnlocked = useCallback(() => {
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
    setUnlocked(true);
  }, []);

  const pinEnabled = profile?.pin_enabled ?? false;
  const ready = hydrated && !authLoading && (!user || profileFetched || !profileLoading);
  const locked = ready && !!user && pinEnabled && !unlocked;

  return { locked, ready, markUnlocked };
}
