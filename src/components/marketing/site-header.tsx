import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { MarketingMobileNav } from "@/components/marketing/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/locales";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations("nav");
  const tTheme = await getTranslations("dashboard.settings");

  let isSignedIn = false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isSignedIn = Boolean(user);
  } catch {
    // Supabase env vars not configured yet in this environment; render as signed-out.
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={`/${locale}`}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href={`/${locale}/pricing`} className="text-muted-foreground hover:text-foreground">
            {t("pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <MarketingMobileNav
            label={t("menu")}
            links={[{ href: `/${locale}/pricing`, label: t("pricing") }]}
          />
          <LocaleSwitcher current={locale} />
          <ThemeToggle
            labels={{
              light: tTheme("themeLight"),
              dark: tTheme("themeDark"),
              system: tTheme("themeSystem"),
            }}
          />
          {isSignedIn ? (
            <Button asChild size="sm" className="ml-2">
              <Link href="/dashboard">{t("dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="ml-2">
                <Link href={`/${locale}/login`}>{t("login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/${locale}/signup`}>{t("signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
