"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PiggyBank } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.85-.08-1.67-.22-2.46H12v4.66h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.55-5.17 3.55-8.83Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44A11.6 11.6 0 0 0 12 0 12 12 0 0 0 1.27 6.6l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function LoginContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "auth_failed";
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <PiggyBank className="size-9" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("app.nameLocal")} · {t("app.name")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("app.tagline")}</p>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("auth.signInTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.signInSubtitle")}</p>

          {hasError && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t("auth.authFailed")}
            </p>
          )}

          <Button
            onClick={handleSignIn}
            disabled={loading}
            variant="outline"
            size="lg"
            className="mt-6 w-full"
          >
            <GoogleIcon />
            {t("auth.continueWithGoogle")}
          </Button>

          <p className="mt-6 text-xs text-muted-foreground">{t("auth.privacyNote")}</p>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <PiggyBank className="size-9" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
