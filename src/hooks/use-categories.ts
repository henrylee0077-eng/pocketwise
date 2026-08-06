"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/lib/queries/categories";
import type { CategoryFormValues } from "@/lib/validations";

export function useCategories() {
  return useLocalQuery(() => fetchCategories(), []);
}

export function useCreateCategory() {
  return useMutation({
    mutationFn: (values: CategoryFormValues) => createCategory(values),
  });
}

export function useUpdateCategory() {
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryFormValues }) =>
      updateCategory(id, values),
  });
}

export function useDeleteCategory() {
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
  });
}
