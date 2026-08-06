"use client";

import { useEffect, useRef } from "react";
import { generateDueRecurringTransactions } from "@/lib/local-db/recurring";

/**
 * Local replacement for the old server cron job
 * (`/api/cron/generate-recurring`, previously run daily by Vercel Cron —
 * see vercel.json). There's no always-on server anymore, so instead this
 * runs the same sweep on-device: once when the app first loads, and again
 * any time the tab/PWA comes back to the foreground after being hidden
 * (covers "closed the app for three days" the same way the daily cron did,
 * since a hidden->visible transition after any gap re-checks all due
 * rules). Silent by design — new transactions land via Dexie's live
 * queries with no UI feedback needed, mirroring how the old cron produced
 * transactions with nobody watching.
 */
export function RecurringSweep() {
  const lastRunRef = useRef<number>(0);

  useEffect(() => {
    function sweep() {
      // Debounce rapid repeat triggers (e.g. multiple visibility events in
      // quick succession) — no need to re-check more than once a minute.
      const now = Date.now();
      if (now - lastRunRef.current < 60_000) return;
      lastRunRef.current = now;

      generateDueRecurringTransactions().catch((error) => {
        console.error("Recurring transaction sweep failed", error);
      });
    }

    sweep();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") sweep();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return null;
}
