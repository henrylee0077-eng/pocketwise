"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2, PiggyBank } from "lucide-react";
import { ensureSeeded } from "@/lib/local-db/seed";

/**
 * Replaces the old AuthProvider as the thing every page waits on before
 * rendering. There's no session to fetch anymore — this just makes sure
 * the on-device database has its default categories/payment
 * methods/settings row seeded (a one-time, idempotent operation per
 * device) before any component tries to read from it.
 */
export function LocalDbProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureSeeded()
      .catch((error) => {
        console.error("Failed to initialize local database", error);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <PiggyBank className="size-9" aria-hidden="true" />
        </div>
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
