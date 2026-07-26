"use client";

import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={t("settings.language")}
        >
          <Languages className="size-4" />
          {locale === "zh" ? "中文" : "EN"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale("en")}>English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("zh")}>中文（简体）</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
