"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { ProjectIcon } from "@/components/projects/ProjectIconPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDeleteProject, useSetProjectArchived } from "@/hooks/use-projects";
import { useFormatCurrency } from "@/hooks/use-currency";
import type { ProjectSpend } from "@/types";

export function ProjectListItem({
  project,
  onEdit,
}: {
  project: ProjectSpend;
  onEdit: () => void;
}) {
  const { t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const deleteProject = useDeleteProject();
  const setArchived = useSetProjectArchived();
  const [open, setOpen] = useState(false);

  const target = project.target_amount != null ? Number(project.target_amount) : null;
  const spent = Number(project.spent);
  const usagePercent = target && target > 0 ? Math.min((spent / target) * 100, 100) : null;
  const overTarget = target != null && spent > target;

  async function handleDelete() {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success(t("projects.deleted"));
    } catch {
      toast.error(t("projects.deleteError"));
    } finally {
      setOpen(false);
    }
  }

  async function handleToggleArchive() {
    try {
      await setArchived.mutateAsync({ id: project.id, isArchived: !project.is_archived });
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${project.color}22`, color: project.color }}
        >
          <ProjectIcon name={project.icon} className="size-5" />
        </span>

        <Link href={`/projects/${project.id}`} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {target != null
              ? t("projects.ofTarget", { spent: formatCurrency(spent), target: formatCurrency(target) })
              : t("projects.spent", { amount: formatCurrency(spent) })}
          </p>
        </Link>

        <button
          type="button"
          onClick={handleToggleArchive}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={project.is_archived ? t("projects.unarchive") : t("projects.archive")}
        >
          {project.is_archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={t("projects.editProject")}
        >
          <Pencil className="size-4" />
        </button>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
              aria-label={t("expenses.delete")}
            >
              <Trash2 className="size-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("projects.deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("projects.deleteConfirmBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("expenses.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>{t("expenses.delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {usagePercent != null && (
        <Progress
          value={usagePercent}
          indicatorClassName={overTarget ? "bg-destructive" : undefined}
        />
      )}
    </div>
  );
}
