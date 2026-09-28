"use client";

import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LOCALES, type Locale } from "@/i18n/locales";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  "pt-BR": "Português (BR)",
  ru: "Русский",
  ro: "Română",
  de: "Deutsch",
  fr: "Français",
  tr: "Türkçe",
  uk: "Українська",
  pl: "Polski",
};

/** Only for marketing pages under `[handle]`, where the current handle *is* the locale. */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(locale: Locale) {
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/") || "/");
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
