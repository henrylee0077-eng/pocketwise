"use client";

import { cn } from "@/lib/utils";

export const CATEGORY_COLOR_OPTIONS = [
  "#F59E0B", "#3B82F6", "#10B981", "#06B6D4", "#A855F7",
  "#F97316", "#92400E", "#6B7280", "#0D9488", "#EC4899",
  "#EF4444", "#84CC16",
];

export function CategoryColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "size-8 rounded-full border-2 transition-transform",
            value === color ? "scale-110 border-foreground" : "border-transparent",
          )}
          style={{ backgroundColor: color }}
          aria-label={color}
        />
      ))}
    </div>
  );
}
