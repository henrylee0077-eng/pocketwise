"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import { createTag, deleteTag, fetchTags } from "@/lib/queries/tags";
import type { TagFormValues } from "@/lib/validations";

export function useTags() {
  return useLocalQuery(() => fetchTags(), []);
}

export function useCreateTag() {
  return useMutation({
    mutationFn: (values: TagFormValues) => createTag(values),
  });
}

export function useDeleteTag() {
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
  });
}
