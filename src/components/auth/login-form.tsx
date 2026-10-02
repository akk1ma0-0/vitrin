"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleIcon } from "@/components/auth/google-icon";
import { FacebookIcon } from "@/components/auth/facebook-icon";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/locales";

export function LoginForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handleGoogle() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  async function handleFacebook() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (identifier.includes("@")) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
        if (error) throw error;
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: identifier, password }),
        });
        if (!res.ok) throw new Error("invalid_credentials");
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-center text-2xl font-semibold">{t("loginTitle")}</h1>

      <Button variant="secondary" onClick={handleGoogle} className="gap-2">
        <GoogleIcon className="h-4 w-4" />
        {t("continueWithGoogle")}
      </Button>

      <Button variant="secondary" onClick={handleFacebook} className="gap-2">
        <FacebookIcon className="h-4 w-4" />
        {t("continueWithFacebook")}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        {t("orDivider")}
        <div className="h-px flex-1 bg-border" />
      </div>

      <Tabs defaultValue="password">
        <TabsList className="w-full">
          <TabsTrigger value="password" className="flex-1">
            {t("loginWithPassword")}
          </TabsTrigger>
          <TabsTrigger value="magic" className="flex-1">
            {t("sendMagicLink")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="identifier">{t("emailLabel")} / {t("usernameLabel")}</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {t("loginTitle")}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="magic">
          {magicSent ? (
            <p className="text-sm text-muted-foreground">{t("magicLinkSent")}</p>
          ) : (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="magic-email">{t("emailLabel")}</Label>
                <Input
                  id="magic-email"
                  type="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {t("sendMagicLink")}
              </Button>
            </form>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href={`/${locale}/signup`} className="font-medium text-[var(--accent)] hover:underline">
          {t("signupTitle")}
        </Link>
      </p>
    </div>
  );
}
