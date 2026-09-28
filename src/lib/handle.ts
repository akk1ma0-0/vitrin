import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/i18n/locales";

/**
 * Every marketing/catalog route lives under the shared `[handle]` segment
 * (see CLAUDE.md "Routing architecture"). Call this at the top of any such
 * page so a request for a real username 404s instead of rendering
 * marketing content.
 */
export function assertLocaleHandle(handle: string): Locale {
  if (!isLocale(handle)) {
    notFound();
  }
  return handle;
}
