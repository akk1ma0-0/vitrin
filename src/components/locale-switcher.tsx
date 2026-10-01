"use client";

import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/locales";

function navigateTo(url: string): void {
  window.location.href = url;
}

/**
 * Only for marketing pages under `[handle]`, where the current handle *is*
 * the locale. Uses a full navigation (`window.location`), not
 * `router.push()`: the root layout (`src/app/layout.tsx`) reads the locale
 * once via `getLocale()` and feeds it to `NextIntlClientProvider`, but root
 * layouts don't re-run on client-side navigation between sibling routes —
 * only the page content re-renders. With `router.push()`, every
 * server-rendered string updates correctly but every Client Component
 * using `useTranslations()` keeps showing the OLD locale indefinitely
 * (confirmed: switching repeatedly never fixes it, only a real page load
 * does). A full navigation re-runs the root layout like any fresh request,
 * so everything — server and client — renders in the new locale from the
 * start.
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();

  function switchTo(locale: Locale) {
    const segments = pathname.split("/");
    segments[1] = locale;
    navigateTo(segments.join("/") || "/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={LOCALE_LABELS[current]}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} onClick={() => switchTo(locale)}>
            {LOCALE_LABELS[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
