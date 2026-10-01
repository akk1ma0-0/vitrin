"use client";

import { useTranslations } from "next-intl";

import { CookieLocaleSwitcher } from "@/components/cookie-locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Theme + language controls bundled together, for every page outside the
 * `[handle]` marketing tree (which already gets both via `SiteHeader`):
 * dashboard, admin, onboarding, and the public profile page.
 */
export function ThemeLocaleControls() {
  const t = useTranslations("dashboard.settings");

  return (
    <div className="flex items-center gap-1">
      <CookieLocaleSwitcher />
      <ThemeToggle labels={{ light: t("themeLight"), dark: t("themeDark"), system: t("themeSystem") }} />
    </div>
  );
}
