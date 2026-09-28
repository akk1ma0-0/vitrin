import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, normalizeLocale, pickLocaleFromAcceptLanguage } from "@/i18n/locales";

const LOCALE_COOKIE = "NEXT_LOCALE";

const PUBLIC_FILE = /\.(.*)$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // `/` has no meaningful "username" interpretation, so it always redirects
  // to a locale-prefixed marketing route (spec section 3).
  if (pathname === "/") {
    const locale =
      normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value ?? "") ??
      pickLocaleFromAcceptLanguage(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  const firstSegment = pathname.split("/")[1] ?? "";
  const urlLocale = normalizeLocale(firstSegment);

  let locale = urlLocale;
  if (urlLocale) {
    // Canonicalize casing, e.g. /pt-br -> /pt-BR, so there's a single indexable URL per locale.
    if (firstSegment !== urlLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${urlLocale}${pathname.slice(1 + firstSegment.length)}`;
      return NextResponse.redirect(url);
    }
  } else {
    locale =
      normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value ?? "") ??
      pickLocaleFromAcceptLanguage(request.headers.get("accept-language"));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-vitrin-locale", locale ?? DEFAULT_LOCALE);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (urlLocale) {
    response.cookies.set(LOCALE_COOKIE, urlLocale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  // Refresh the Supabase auth session on every navigation so Server
  // Components always see an up-to-date session (required by @supabase/ssr).
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: requestHeaders } });
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
