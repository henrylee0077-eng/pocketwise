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
import { CategoryColorPicker } from "@/components/settings/CategoryColorPicker";
import { ProjectIconPicker } from "@/components/projects/ProjectIconPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import { usePreferredCurrency } from "@/hooks/use-currency";
import { getCurrency } from "@/lib/currencies";
import { projectFormSchema, type ProjectFormInput, type ProjectFormValues } from "@/lib/validations";
import type { Project } from "@/types";

const DEFAULTS = {
  name: "",
  color: "#0D9488",
  icon: "Sparkles",
  targetAmount: undefined,
  startDate: "",
  endDate: "",
};

function toFormValues(project?: Project) {
  if (!project) return DEFAULTS;
  return {
    name: project.name,
    color: project.color,
    icon: project.icon,
    targetAmount: project.target_amount ?? undefined,
    startDate: project.start_date ?? "",
    endDate: project.end_date ?? "",
  };
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}) {
  const { t } = useLanguage();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const currencySymbol = getCurrency(usePreferredCurrency()).symbol;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: toFormValues(project),
  });

  useEffect(() => {
    if (open) reset(toFormValues(project));
  }, [open, project, reset]);

  const color = watch("color");
  const icon = watch("icon");

  async function onSubmit(values: ProjectFormValues) {
    try {
      if (project) {
        await updateProject.mutateAsync({ id: project.id, values });
      } else {
        await createProject.mutateAsync(values);
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
          <DialogTitle>{project ? t("projects.editProject") : t("projects.newProject")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t("projects.name")}</Label>
            <Input id="name" placeholder={t("projects.namePlaceholder")} {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("categories.color")}</Label>
            <CategoryColorPicker value={color} onChange={(c) => setValue("color", c)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("categories.icon")}</Label>
            <ProjectIconPicker value={icon} onChange={(i) => setValue("icon", i)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="targetAmount">{t("projects.targetAmount")}</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                id="targetAmount"
                inputMode="decimal"
                step="0.01"
                placeholder={t("projects.targetAmountPlaceholder")}
                className="pl-11"
                {...register("targetAmount")}
              />
            </div>
            {errors.targetAmount && (
              <p className="text-sm text-destructive">{errors.targetAmount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">{t("projects.startDate")}</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">{t("projects.endDate")}</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

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
