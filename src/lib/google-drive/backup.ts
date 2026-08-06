// Talks to the Drive REST API directly from the browser (no server
// involved — the access token is scoped only to the app's own hidden
// "appDataFolder" space, so this can't see or touch the rest of the
// user's Drive). Combined with src/lib/local-db/backup.ts, this is the
// whole backup/restore/sync story: one JSON file, one Drive folder,
// entirely inside the user's own Google account.
"use client";

import { db, nowIso } from "@/lib/local-db/schema";
import { exportAllData, importAllData, type BackupPayload } from "@/lib/local-db/backup";
import { fetchGoogleProfile, requestGoogleAccessToken } from "@/lib/google-drive/auth";

const BACKUP_FILE_NAME = "pocketwise-backup.json";
const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_ENDPOINT = "https://www.googleapis.com/upload/drive/v3/files";

async function findBackupFileId(accessToken: string): Promise<string | null> {
  const url = new URL(DRIVE_FILES_ENDPOINT);
  url.searchParams.set("spaces", "appDataFolder");
  url.searchParams.set("q", `name = '${BACKUP_FILE_NAME}'`);
  url.searchParams.set("fields", "files(id, modifiedTime)");
  url.searchParams.set("pageSize", "1");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to look up existing backup on Google Drive");

  const json = (await response.json()) as { files?: { id: string }[] };
  return json.files?.[0]?.id ?? null;
}

/**
 * Signs the user in (prompting Google consent for their app-data Drive
 * folder if not already granted) and records their profile locally so the
 * Settings page can show who's connected.
 */
export async function connectGoogleAccount() {
  const accessToken = await requestGoogleAccessToken();
  const profile = await fetchGoogleProfile(accessToken);

  await db.settings.update("singleton", {
    googleAccountId: profile.accountId,
    googleEmail: profile.email,
    googleName: profile.name,
    googlePicture: profile.picture,
    updatedAt: nowIso(),
  });

  return profile;
}

export async function disconnectGoogleAccount() {
  await db.settings.update("singleton", {
    googleAccountId: null,
    googleEmail: null,
    googleName: null,
    googlePicture: null,
    updatedAt: nowIso(),
  });
}

/** Serializes the local database and uploads it to the user's hidden Drive
 * app-data folder, overwriting any previous backup. */
export async function backupToDrive(): Promise<void> {
  const accessToken = await requestGoogleAccessToken();
  const payload = await exportAllData();
  const existingFileId = await findBackupFileId(accessToken);

  const body = JSON.stringify(payload);

  if (existingFileId) {
    const response = await fetch(`${DRIVE_UPLOAD_ENDPOINT}/${existingFileId}?uploadType=media`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (!response.ok) throw new Error("Failed to update backup on Google Drive");
  } else {
    const boundary = "pocketwise-backup-boundary";
    const metadata = { name: BACKUP_FILE_NAME, parents: ["appDataFolder"] };
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n${body}\r\n` +
      `--${boundary}--`;

    const response = await fetch(`${DRIVE_UPLOAD_ENDPOINT}?uploadType=multipart`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });
    if (!response.ok) throw new Error("Failed to create backup on Google Drive");
  }

  await db.settings.update("singleton", { lastBackupAt: nowIso(), updatedAt: nowIso() });
}

/** Downloads the backup from Drive (if one exists) and overwrites all
 * local data with it. Returns `false` with nothing changed if this Google
 * account has no PocketWise backup yet. */
export async function restoreFromDrive(): Promise<boolean> {
  const accessToken = await requestGoogleAccessToken();
  const fileId = await findBackupFileId(accessToken);
  if (!fileId) return false;

  const response = await fetch(`${DRIVE_FILES_ENDPOINT}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to download backup from Google Drive");

  const payload = (await response.json()) as BackupPayload;
  await importAllData(payload);
  return true;
}

/** True if a backup exists on Drive for the currently-connected account,
 * without downloading or changing anything — used to offer "Restore" only
 * when there's something to restore. */
export async function hasDriveBackup(): Promise<boolean> {
  const accessToken = await requestGoogleAccessToken();
  const fileId = await findBackupFileId(accessToken);
  return fileId !== null;
}
