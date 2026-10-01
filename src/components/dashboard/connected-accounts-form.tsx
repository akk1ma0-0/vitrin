"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { UserIdentity } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/auth/google-icon";
import { FacebookIcon } from "@/components/auth/facebook-icon";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type OAuthProvider = "google" | "facebook";

/**
 * Lets a signed-in user attach every login method to the same account
 * (Google/Facebook via Supabase's own identity linking, Telegram via our
 * custom bridge in /api/auth/telegram/link) and set/change a password
 * regardless of how they originally signed up — see `updateUser({
 * password })`, which Supabase explicitly supports for OAuth-only accounts.
 */
export function ConnectedAccountsForm({
  telegramLinked,
  telegramBotUsername,
}: {
  telegramLinked: boolean;
  telegramBotUsername: string | null;
}) {
  const t = useTranslations("dashboard.connectedAccounts");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [pending, setPending] = useState<OAuthProvider | "telegram" | null>(null);

  async function refreshIdentities() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUserIdentities();
    setIdentities(data?.identities ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching the current identities on mount
    void refreshIdentities();
  }, []);

  useEffect(() => {
    const telegramError = searchParams.get("telegram_error");
    const telegramOk = searchParams.get("telegram_linked");
    const authError = searchParams.get("auth_error");
    if (!telegramError && !telegramOk && !authError) return;

    if (telegramError) {
      toast.error(telegramError === "already_linked" ? t("connectErrorAlreadyLinked") : t("connectErrorGeneric"));
    } else if (telegramOk) {
      toast.success(t("connectSuccess"));
    } else if (authError) {
      toast.error(t("connectErrorGeneric"));
    }
    router.replace(pathname);
  }, [searchParams, pathname, router, t]);

  const hasPassword = identities.some((i) => i.provider === "email");
  const hasGoogle = identities.some((i) => i.provider === "google");
  const hasFacebook = identities.some((i) => i.provider === "facebook");

  async function handleConnect(provider: OAuthProvider) {
    setPending(provider);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard/profile` },
    });
    if (error) {
      toast.error(t("connectErrorGeneric"));
      setPending(null);
    }
    // On success the browser navigates away to the OAuth provider.
  }

  async function handleDisconnect(provider: OAuthProvider) {
    const identity = identities.find((i) => i.provider === provider);
    if (!identity) return;

    setPending(provider);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) {
        toast.error(t("disconnectErrorLastMethod"));
        return;
      }
      toast.success(t("disconnectSuccess"));
      await refreshIdentities();
    } finally {
      setPending(null);
    }
  }

  async function handleDisconnectTelegram() {
    setPending("telegram");
    try {
      const res = await fetch("/api/auth/telegram/unlink", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success(t("disconnectSuccess"));
      router.refresh();
    } catch {
      toast.error(t("disconnectErrorLastMethod"));
    } finally {
      setPending(null);
    }
  }

  async function handleSetPassword() {
    if (newPassword.length < 8) {
      toast.error(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t("passwordUpdated"));
      setNewPassword("");
      setConfirmPassword("");
      await refreshIdentities();
    } catch {
      toast.error(t("passwordUpdateFailed"));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div>
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          <GoogleIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{t("google")}</span>
        </div>
        {hasGoogle ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDisconnect("google")}
            disabled={pending === "google"}
          >
            {t("disconnect")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleConnect("google")}
            disabled={pending === "google"}
          >
            {t("connect")}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          <FacebookIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{t("facebook")}</span>
        </div>
        {hasFacebook ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDisconnect("facebook")}
            disabled={pending === "facebook"}
          >
            {t("disconnect")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleConnect("facebook")}
            disabled={pending === "facebook"}
          >
            {t("connect")}
          </Button>
        )}
      </div>

      {telegramBotUsername && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <span className="text-sm font-medium">{t("telegram")}</span>
          {telegramLinked ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDisconnectTelegram}
              disabled={pending === "telegram"}
            >
              {t("disconnect")}
            </Button>
          ) : (
            <TelegramLoginButton
              botUsername={telegramBotUsername}
              authPath="/api/auth/telegram/link"
              next="/dashboard/profile"
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <span className="text-sm font-medium">{t("passwordTitle")}</span>
        <p className="text-xs text-muted-foreground">
          {hasPassword ? t("passwordSetDescription") : t("passwordNotSetDescription")}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>{t("newPasswordLabel")}</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("confirmPasswordLabel")}</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
            />
          </div>
        </div>
        <Button onClick={handleSetPassword} disabled={savingPassword || !newPassword} className="self-start">
          {hasPassword ? t("changePassword") : t("setPassword")}
        </Button>
      </div>
    </div>
  );
}
