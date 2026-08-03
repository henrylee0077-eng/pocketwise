"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { ProjectListItem } from "@/components/projects/ProjectListItem";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useProjects } from "@/hooks/use-projects";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const { t } = useLanguage();
  const { data: projects = [], isLoading } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>(undefined);

  const active = projects.filter((p) => !p.is_archived);
  const archived = projects.filter((p) => p.is_archived);

  function openNew() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setDialogOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("projects.title")}</h1>
      <p className="-mt-3 text-sm text-muted-foreground">{t("projects.hint")}</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={openNew} className="self-start">
            <Plus className="size-4" />
            {t("projects.newProject")}
          </Button>

          {active.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("projects.empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {active.map((project) => (
                <ProjectListItem key={project.id} project={project} onEdit={() => openEdit(project)} />
              ))}
            </div>
          )}

          {archived.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-sm font-semibold text-muted-foreground">{t("projects.archived")}</h2>
              {archived.map((project) => (
                <ProjectListItem key={project.id} project={project} onEdit={() => openEdit(project)} />
              ))}
            </div>
          )}
        </>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} />
    </div>
  );
}
