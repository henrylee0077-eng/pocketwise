"use client";

import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

export const CATEGORY_ICON_OPTIONS = [
  "UtensilsCrossed", "Car", "ShoppingBasket", "HeartPulse", "ShoppingBag",
  "Film", "Coffee", "MoreHorizontal", "Wallet", "Gift", "Briefcase",
  "TrendingUp", "Home", "Plane", "Book", "Dumbbell", "PawPrint", "Baby",
  "Wrench", "Fuel", "Smartphone", "Landmark", "GraduationCap", "Shirt",
] as const;

export function CategoryIconPicker({
  value,
  onChange,
  color,
}: {
  value: string;
  onChange: (icon: string) => void;
  color: string;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {CATEGORY_ICON_OPTIONS.map((iconName) => {
        const Icon =
          (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName] ??
          LucideIcons.MoreHorizontal;
        const selected = value === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border transition-colors",
              selected ? "border-primary" : "border-border hover:bg-secondary",
            )}
            style={selected ? { backgroundColor: `${color}22`, color } : undefined}
          >
            <Icon className="size-4.5" />
          </button>
        );
      })}
    </div>
  );
}
