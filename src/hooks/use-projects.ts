"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createProject,
  deleteProject,
  fetchProjectSpend,
  setProjectArchived,
  updateProject,
} from "@/lib/queries/projects";
import type { ProjectFormValues } from "@/lib/validations";
import { useAuth } from "@/components/providers/AuthProvider";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjectSpend(createClient()),
    staleTime: 30_000,
  });
}

export function useCreateProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ProjectFormValues) => {
      if (!user) throw new Error("Not authenticated");
      return createProject(createClient(), user.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) =>
      updateProject(createClient(), id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useSetProjectArchived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      setProjectArchived(createClient(), id, isArchived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(createClient(), id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      // Deleting a project unlinks (not deletes) its transactions server-side,
      // so cached transaction lists need to refetch to drop the stale link.
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
