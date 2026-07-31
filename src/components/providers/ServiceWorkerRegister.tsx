"use client";

import { useEffect } from "react";

/**
 * Registers the app's service worker so PocketWise can be installed
 * ("Add to Home Screen") on iOS/Android and keeps working offline for
 * already-visited pages. Renders nothing — side effect only.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
