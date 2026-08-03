"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectIcon } from "@/components/projects/ProjectIconPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useProjects } from "@/hooks/use-projects";

const NONE = "__none__";

/** Optional, clearable project selector — unlike AccountPicker/CategoryPicker, "no project" is a valid, common choice. */
export function ProjectPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useLanguage();
  const { data: projects = [] } = useProjects();
  const options = projects.filter((p) => !p.is_archived);

  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger>
        <SelectValue placeholder={t("transactions.noProject")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{t("transactions.noProject")}</SelectItem>
        {options.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <span className="flex items-center gap-2">
              <ProjectIcon name={project.icon} className="size-4 text-muted-foreground" />
              {project.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
