"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

/**
 * Thin wrapper around Dexie's `useLiveQuery` that returns the same
 * `{ data, isLoading, isError, isFetched }` shape every component in the
 * app was already built against (from the TanStack Query days). Dexie
 * automatically tracks which tables a query touches and re-runs it
 * whenever any of them change — so this gets "live" data with none of the
 * manual `queryClient.invalidateQueries` bookkeeping the old Supabase
 * hooks needed after every mutation.
 *
 * Local IndexedDB reads essentially don't fail in normal operation, so
 * unlike the old network-backed queries this doesn't surface a real error
 * state — a thrown error is logged to the console and treated the same as
 * "still loading" rather than shown in the UI.
 */
export function useLocalQuery<T>(querier: () => Promise<T> | T, deps: unknown[] = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies the full dep list explicitly, mirroring useMemo/useEffect's own contract
  const data = useLiveQuery(querier, deps);

  return useMemo(
    () => ({
      data,
      isLoading: data === undefined,
      isFetched: data !== undefined,
      isError: false as const,
    }),
    [data],
  );
}
