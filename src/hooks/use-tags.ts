"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { createTag, deleteTag, fetchTags } from "@/lib/queries/tags";
import type { TagFormValues } from "@/lib/validations";
import { useAuth } from "@/components/providers/AuthProvider";

export function useTags() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tags", user?.id],
    queryFn: () => fetchTags(createClient()),
    enabled: !!user,
  });
}

export function useCreateTag() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: TagFormValues) => {
      if (!user) throw new Error("Not authenticated");
      return createTag(createClient(), user.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", user?.id] });
    },
  });
}

export function useDeleteTag() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTag(createClient(), id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", user?.id] });
    },
  });
}
