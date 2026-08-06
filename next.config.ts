import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pins the workspace root explicitly — otherwise Next.js infers it by
  // walking up for the nearest lockfile, and finds an unrelated one in a
  // parent folder (C:\Users\henry\package-lock.json), which produces a
  // "multiple lockfiles" warning on every dev/build run.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        // Never cache the service worker script itself — otherwise a CDN
        // or browser could keep serving a stale version indefinitely and
        // future PWA updates would never reach installed users.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
