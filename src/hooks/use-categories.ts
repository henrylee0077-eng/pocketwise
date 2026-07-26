"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchCategories } from "@/lib/queries/categories";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(createClient()),
    staleTime: 5 * 60_000,
  });
}
