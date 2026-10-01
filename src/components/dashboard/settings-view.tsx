"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ACCENT_COLORS } from "@/lib/accent-colors";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/locales";
import type { PublicProfile } from "@/lib/profiles";
import { cn } from "@/lib/utils";

export function SettingsView({ profile }: { profile: PublicProfile }) {
  const t = useTranslations("dashboard.settings");
  const tCommon = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [accentColor, setAccentColor] = useState(profile.accent_color);
  const [uiLocale, setUiLocale] = useState<Locale>(profile.ui_locale as Locale);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isPro = profile.plan === "pro";

  async function handleAccentChange(hex: string) {
    if (!isPro) return;
    setAccentColor(hex);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accentColor: hex }),
    });
  }

  async function handleLocaleChange(locale: Locale) {
    setUiLocale(locale);
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uiLocale: locale }),
    });
    router.refresh();
  }

  async function handleExport() {
    const res = await fetch("/api/account/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vitrin-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <span className="text-sm font-medium">{t("theme")}</span>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">{t("themeLight")}</SelectItem>
            <SelectItem value="dark">{t("themeDark")}</SelectItem>
            <SelectItem value="system">{t("themeSystem")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("accentColor")}</span>
          {!isPro && <span className="text-xs text-muted-foreground">{t("accentColorPro")}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.hex}
              disabled={!isPro}
              onClick={() => handleAccentChange(c.hex)}
              className={cn(
                "h-8 w-8 rounded-full disabled:cursor-not-allowed disabled:opacity-40",
                accentColor === c.hex && "ring-2 ring-offset-2 ring-offset-background",
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={c.name}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <span className="text-sm font-medium">{t("language")}</span>
        <Select value={uiLocale} onValueChange={(v) => handleLocaleChange(v as Locale)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((l) => (
              <SelectItem key={l} value={l}>
                {LOCALE_LABELS[l]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <span className="text-sm font-medium">{t("exportData")}</span>
        <Button variant="secondary" onClick={handleExport}>
          {t("exportData")}
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-red-500/30 p-4">
        <div>
          <p className="text-sm font-medium text-red-500">{t("deleteAccount")}</p>
          <p className="text-xs text-muted-foreground">{t("deleteAccountWarning")}</p>
        </div>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          {t("deleteAccount")}
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("deleteAccount")}</DialogTitle>
            <DialogDescription>{t("deleteAccountWarning")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {t("deleteAccount")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
