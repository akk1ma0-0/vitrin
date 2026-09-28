import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/locales";

/**
 * Locale resolution deliberately does not use next-intl's own routing
 * middleware: the spec's URL scheme (locale-prefixed marketing pages vs.
 * un-prefixed `/{username}` profiles) can't be expressed as a single
 * `[locale]` segment. src/proxy.ts resolves the locale for every request
 * (from the URL handle when it's a marketing route, otherwise from the
 * `NEXT_LOCALE` cookie / Accept-Language) and forwards it in the
 * `x-vitrin-locale` request header, which this file just reads back.
 */
export default getRequestConfig(async () => {
  const headerList = await headers();
  const headerLocale = headerList.get("x-vitrin-locale");
  const locale: Locale = headerLocale && isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return { locale, messages };
});
