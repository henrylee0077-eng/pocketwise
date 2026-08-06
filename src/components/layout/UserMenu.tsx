"use client";

import Link from "next/link";
import { Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGoogleAccount } from "@/hooks/use-google-backup";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * There's no "signed in" concept anymore — every device has exactly one
 * local user — so this just surfaces whichever Google account (if any) is
 * connected for backup, and links into Settings to manage it. Nothing
 * here gates access to the app.
 */
export function UserMenu() {
  const { data: account } = useGoogleAccount();
  const { t } = useLanguage();

  const connected = account?.connected ?? false;
  const name = account?.name ?? "";
  const initial = name ? name.charAt(0).toUpperCase() : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar>
            {connected && <AvatarImage src={account?.picture ?? undefined} alt={name} />}
            <AvatarFallback>
              {initial ?? <User className="size-4 text-muted-foreground" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="truncate">
          {connected ? name : t("settings.backup.title")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" /> {t("nav.settings")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
