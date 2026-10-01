"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/locales";

const LOCALE_COOKIE = "NEXT_LOCALE";

function setLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

/**
 * For pages whose URL has no locale segment — dashboard, admin, onboarding,
 * a username's public profile — where `LocaleSwitcher`'s "rewrite the URL"
 * approach doesn't apply (there's no locale segment to rewrite, and on a
 * profile page that segment is the username). Sets the `NEXT_LOCALE` cookie
 * `src/proxy.ts` already reads for exactly this case, then refreshes so the
 * server re-renders with it.
 */
export function CookieLocaleSwitcher() {
  const router = useRouter();
  const locale = useLocale() as Locale;

  function switchTo(next: Locale) {
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={LOCALE_LABELS[locale]}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onClick={() => switchTo(l)}>
            {LOCALE_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
