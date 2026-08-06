// Sign-in for backup only — never a gate on using the app itself. Uses
// Google Identity Services' OAuth2 token client to get a short-lived
// access token scoped to the user's own hidden Drive "app data" folder
// (15GB free per Google account, invisible in their regular Drive UI,
// deleted automatically if they uninstall the app from their account).
// This never touches PocketWise's own infrastructure or cost — the data
// lives entirely in the user's own Google account.
"use client";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const IDENTITY_SCOPES = "openid email profile";
const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type: string }) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

let gisLoadPromise: Promise<void> | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Sign-In requires a browser"));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

export interface GoogleProfile {
  accountId: string;
  email: string;
  name: string;
  picture: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function getClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Google Sign-In isn't configured yet (missing NEXT_PUBLIC_GOOGLE_CLIENT_ID). Backup/restore is unavailable until this is set up.",
    );
  }
  return clientId;
}

/**
 * Requests a fresh Drive-scoped access token, prompting the user for
 * consent if needed. Access tokens last ~1 hour; callers should request a
 * new one per backup/restore action rather than trying to cache across
 * app sessions.
 */
export async function requestGoogleAccessToken(): Promise<string> {
  await loadGoogleIdentityServices();

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const clientId = getClientId();

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: `${IDENTITY_SCOPES} ${DRIVE_SCOPE}`,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description ?? response.error ?? "Google Sign-In was cancelled"));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(`Google Sign-In failed: ${error.type}`));
      },
    });
    client.requestAccessToken();
  });

  // Access tokens are typically valid for 3600s; refresh a little early.
  cachedAccessToken = { token: accessToken, expiresAt: Date.now() + 55 * 60_000 };
  return accessToken;
}

export function clearCachedAccessToken(): void {
  cachedAccessToken = null;
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch Google account info");

  const json = (await response.json()) as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  };

  return {
    accountId: json.sub,
    email: json.email,
    name: json.name ?? json.email,
    picture: json.picture ?? "",
  };
}
