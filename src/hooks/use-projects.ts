"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import {
  createProject,
  deleteProject,
  fetchProjectSpend,
  setProjectArchived,
  updateProject,
} from "@/lib/queries/projects";
import type { ProjectFormValues } from "@/lib/validations";

export function useProjects() {
  return useLocalQuery(() => fetchProjectSpend(), []);
}

export function useCreateProject() {
  return useMutation({
    mutationFn: (values: ProjectFormValues) => createProject(values),
  });
}

export function useUpdateProject() {
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) =>
      updateProject(id, values),
  });
}

export function useSetProjectArchived() {
  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      setProjectArchived(id, isArchived),
  });
}

export function useDeleteProject() {
  return useMutation({
    // deleteProject also unlinks (sets project_id -> null on) any
    // transactions that referenced it; Dexie's live queries pick up both
    // table changes automatically, no manual cache invalidation needed.
    mutationFn: (id: string) => deleteProject(id),
  });
}
