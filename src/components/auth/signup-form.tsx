"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/auth/google-icon";
import { FacebookIcon } from "@/components/auth/facebook-icon";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { Turnstile } from "@/components/turnstile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/locales";

export function SignupForm({ locale, telegramBotUsername }: { locale: Locale; telegramBotUsername: string | null }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  async function handleGoogle() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding` },
    });
  }

  async function handleFacebook() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding` },
    });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
          captchaToken: turnstileToken,
        },
      });
      if (error) throw error;
      setAwaitingVerification(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (awaitingVerification) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-2 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{t("verifyEmailTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("verifyEmailBody", { email })}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-center text-2xl font-semibold">{t("signupTitle")}</h1>

      <Button variant="secondary" onClick={handleGoogle} className="gap-2">
        <GoogleIcon className="h-4 w-4" />
        {t("continueWithGoogle")}
      </Button>

      <Button variant="secondary" onClick={handleFacebook} className="gap-2">
        <FacebookIcon className="h-4 w-4" />
        {t("continueWithFacebook")}
      </Button>

      {telegramBotUsername && <TelegramLoginButton botUsername={telegramBotUsername} next="/onboarding" />}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        {t("orDivider")}
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <Input
            id="password"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Turnstile onVerify={setTurnstileToken} />
        <Button type="submit" disabled={loading || !turnstileToken}>
          {t("signupTitle")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href={`/${locale}/login`} className="font-medium text-[var(--accent)] hover:underline">
          {t("loginTitle")}
        </Link>
      </p>
    </div>
  );
}
