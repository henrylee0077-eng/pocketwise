"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CategoryIconPicker } from "@/components/settings/CategoryIconPicker";
import { CategoryColorPicker } from "@/components/settings/CategoryColorPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validations";
import type { Category } from "@/types";

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  defaultType: "expense" | "income";
}) {
  const { t } = useLanguage();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      type: category?.type ?? defaultType,
      nameEn: category?.name_en ?? "",
      nameZh: category?.name_zh ?? "",
      icon: category?.icon ?? "MoreHorizontal",
      color: category?.color ?? "#6B7280",
      isEssential: category?.is_essential ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: category?.type ?? defaultType,
        nameEn: category?.name_en ?? "",
        nameZh: category?.name_zh ?? "",
        icon: category?.icon ?? "MoreHorizontal",
        color: category?.color ?? "#6B7280",
        isEssential: category?.is_essential ?? true,
      });
    }
  }, [open, category, defaultType, reset]);

  const icon = watch("icon");
  const color = watch("color");
  const isEssential = watch("isEssential");
  const type = watch("type");

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (category) {
        await updateCategory.mutateAsync({ id: category.id, values });
      } else {
        await createCategory.mutateAsync(values);
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? t("categories.editCategory") : t("categories.newCategory")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setValue("type", option)}
                className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                  type === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t(option === "expense" ? "transactions.typeExpense" : "transactions.typeIncome")}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nameEn">{t("categories.nameEn")}</Label>
            <Input id="nameEn" {...register("nameEn")} />
            {errors.nameEn && <p className="text-sm text-destructive">{errors.nameEn.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nameZh">{t("categories.nameZh")}</Label>
            <Input id="nameZh" {...register("nameZh")} />
            {errors.nameZh && <p className="text-sm text-destructive">{errors.nameZh.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("categories.color")}</Label>
            <CategoryColorPicker value={color} onChange={(c) => setValue("color", c)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("categories.icon")}</Label>
            <CategoryIconPicker value={icon} onChange={(i) => setValue("icon", i)} color={color} />
          </div>

          {type === "expense" && (
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">{t("categories.essential")}</p>
                <p className="text-xs text-muted-foreground">{t("categories.essentialHint")}</p>
              </div>
              <Switch
                checked={isEssential}
                onCheckedChange={(v) => setValue("isEssential", v)}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t("expenses.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
