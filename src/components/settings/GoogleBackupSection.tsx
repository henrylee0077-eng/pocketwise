"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CloudUpload, LogOut, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  useBackupToDrive,
  useConnectGoogleAccount,
  useDisconnectGoogleAccount,
  useGoogleAccount,
  useRestoreFromDrive,
} from "@/hooks/use-google-backup";

function formatTimestamp(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * All of PocketWise's data lives on-device (see src/lib/local-db) — this
 * section is the only place Google ever enters the picture, and only if
 * the person opts in. Connecting signs in for Drive's hidden "app data"
 * folder (15GB free, invisible in their normal Drive, scoped only to this
 * app) so they can move data between phones or recover after a
 * reinstall — never a requirement to use the app itself.
 */
export function GoogleBackupSection() {
  const { t, locale } = useLanguage();
  const { data: account } = useGoogleAccount();
  const connect = useConnectGoogleAccount();
  const disconnect = useDisconnectGoogleAccount();
  const backup = useBackupToDrive();
  const restore = useRestoreFromDrive();
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

  async function handleConnect() {
    try {
      await connect.mutateAsync();
      toast.success(t("settings.backup.connected"));
    } catch {
      toast.error(t("settings.backup.connectError"));
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect.mutateAsync();
      toast.success(t("settings.backup.disconnected"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  async function handleBackup() {
    try {
      await backup.mutateAsync();
      toast.success(t("settings.backup.backupSuccess"));
    } catch {
      toast.error(t("settings.backup.backupError"));
    }
  }

  async function handleRestore() {
    setConfirmRestoreOpen(false);
    try {
      const restored = await restore.mutateAsync();
      if (restored) {
        toast.success(t("settings.backup.restoreSuccess"));
      } else {
        toast.error(t("settings.backup.noBackupFound"));
      }
    } catch {
      toast.error(t("settings.backup.restoreError"));
    }
  }

  const lastBackup = formatTimestamp(account?.lastBackupAt ?? null, locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.backup.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{t("settings.backup.description")}</p>

        {account?.connected ? (
          <>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={account.picture ?? undefined} alt={account.name ?? ""} />
                <AvatarFallback>{(account.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{account.name}</p>
                <p className="truncate text-xs text-muted-foreground">{account.email}</p>
              </div>
            </div>

            {lastBackup && (
              <p className="text-xs text-muted-foreground">
                {t("settings.backup.lastBackup", { time: lastBackup })}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleBackup} disabled={backup.isPending} className="gap-2">
                <CloudUpload className="size-4" />
                {backup.isPending ? t("settings.backup.backingUp") : t("settings.backup.backupNow")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmRestoreOpen(true)}
                disabled={restore.isPending}
                className="gap-2"
              >
                <RefreshCw className="size-4" />
                {restore.isPending ? t("settings.backup.restoring") : t("settings.backup.restore")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDisconnect}
                disabled={disconnect.isPending}
                className="gap-2 text-muted-foreground"
              >
                <LogOut className="size-4" />
                {t("settings.backup.disconnect")}
              </Button>
            </div>
          </>
        ) : (
          <Button type="button" onClick={handleConnect} disabled={connect.isPending} className="w-fit">
            {connect.isPending ? t("settings.backup.connecting") : t("settings.backup.connect")}
          </Button>
        )}
      </CardContent>

      <AlertDialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.backup.restoreConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.backup.restoreConfirmWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("security.pinDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>{t("settings.backup.restore")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
