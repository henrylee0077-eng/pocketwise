"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/i18n/LanguageProvider";

export function UserMenu() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  async function handleSignOut() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="size-4" /> {t("auth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
