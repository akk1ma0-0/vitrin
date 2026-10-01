import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth (Google, Facebook) and magic-link redirect target — exchanges the
 * auth code for a session. Also doubles as the `linkIdentity()` callback
 * (same PKCE code-exchange flow) when a signed-in user connects another
 * provider from /dashboard/profile; `next` is how that distinguishes
 * itself from a plain sign-in, so a failure there returns to the profile
 * page with a flag instead of bouncing an already-signed-in user to /login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");
  const next = explicitNext ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (explicitNext) {
    return NextResponse.redirect(`${origin}${explicitNext}?auth_error=1`);
  }
  return NextResponse.redirect(`${origin}/en/login?error=auth_failed`);
}
