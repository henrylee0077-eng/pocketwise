"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalQuery } from "@/hooks/use-local-query";
import { fetchSettings } from "@/lib/local-db/security";
import {
  backupToDrive,
  connectGoogleAccount,
  disconnectGoogleAccount,
  hasDriveBackup,
  restoreFromDrive,
} from "@/lib/google-drive/backup";
import { clearCachedAccessToken } from "@/lib/google-drive/auth";

export interface GoogleAccountState {
  connected: boolean;
  accountId: string | null;
  email: string | null;
  name: string | null;
  picture: string | null;
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
}

/**
 * Read-only view of the device's Google identity + backup status, sourced
 * from local settings (never from a server session — signing in for Drive
 * backup is entirely optional and separate from using the app). Live via
 * Dexie, so it updates the moment connect/disconnect/backup/restore write
 * to the settings table.
 */
export function useGoogleAccount() {
  return useLocalQuery(async (): Promise<GoogleAccountState> => {
    const settings = await fetchSettings();
    return {
      connected: Boolean(settings.googleAccountId),
      accountId: settings.googleAccountId,
      email: settings.googleEmail,
      name: settings.googleName,
      picture: settings.googlePicture,
      lastBackupAt: settings.lastBackupAt,
      lastRestoreAt: settings.lastRestoreAt,
    };
  }, []);
}

export function useConnectGoogleAccount() {
  return useMutation({
    mutationFn: () => connectGoogleAccount(),
  });
}

export function useDisconnectGoogleAccount() {
  return useMutation({
    mutationFn: async () => {
      clearCachedAccessToken();
      await disconnectGoogleAccount();
    },
  });
}

export function useBackupToDrive() {
  return useMutation({
    mutationFn: () => backupToDrive(),
  });
}

/**
 * Restoring overwrites every local table (see importAllData), which every
 * other screen's live queries are reading from — so unlike the rest of
 * this app's mutations, this one does invalidate everything afterward to
 * force an immediate re-render instead of waiting on Dexie's own change
 * tracking to notice a bulk clear-and-reload.
 */
export function useRestoreFromDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => restoreFromDrive(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useHasDriveBackup() {
  return useMutation({
    mutationFn: () => hasDriveBackup(),
  });
}
