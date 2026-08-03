"use client";

import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

export const PROJECT_ICON_OPTIONS = [
  "Sparkles", "Home", "Hammer", "Heart", "PartyPopper",
  "GraduationCap", "Baby", "Car", "Plane", "Briefcase",
  "Gift", "Trophy",
] as const;

export function ProjectIcon({ name, className }: { name: string; className?: string }) {
  const Icon =
    (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name] ??
    LucideIcons.Sparkles;
  return <Icon className={className} />;
}

export function ProjectIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PROJECT_ICON_OPTIONS.map((iconName) => {
        const selected = value === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border transition-colors",
              selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary",
            )}
          >
            <ProjectIcon name={iconName} className="size-4.5" />
          </button>
        );
      })}
    </div>
  );
}
