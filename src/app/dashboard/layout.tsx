import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headerList = await headers();
  const headerLocale = headerList.get("x-vitrin-locale");
  const locale = headerLocale && isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;

  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const tTheme = await getTranslations("dashboard.settings");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border md:block">
        <div className="flex h-16 items-center px-4">
          <Link href={`/${locale}`}>
            <Logo />
          </Link>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link
            href={`/${profile.username}`}
            target="_blank"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            vitrin.work/{profile.username}
          </Link>
          <ThemeToggle
            labels={{ light: tTheme("themeLight"), dark: tTheme("themeDark"), system: tTheme("themeSystem") }}
          />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
