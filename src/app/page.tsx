import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";

/**
 * src/proxy.ts already redirects `/` to `/{locale}` before this ever
 * renders. This is a fallback for the (unlikely) case a request reaches
 * here without going through the proxy.
 */
export default async function RootPage() {
  const headerList = await headers();
  const headerLocale = headerList.get("x-vitrin-locale");
  const locale = headerLocale && isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  redirect(`/${locale}`);
}
