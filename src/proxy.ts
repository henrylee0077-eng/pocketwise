import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, manifest (static assets)
     * - sw.js, offline.html, apple-touch-icon.png, favicon-16/32.png (PWA
     *   assets — these must stay reachable regardless of auth state, or
     *   the service worker/install prompt breaks for signed-out visitors)
     * - .well-known (Digital Asset Links / TWA verification — Android
     *   fetches this anonymously; redirecting it to /login breaks the
     *   TWA's trusted-app verification and Chrome falls back to showing
     *   the URL bar)
     */
    "/((?!_next/static|_next/image|favicon.ico|favicon-16.png|favicon-32.png|apple-touch-icon.png|icons|manifest.webmanifest|sw.js|offline.html|\\.well-known).*)",
  ],
};
