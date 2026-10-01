import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Sends an already-signed-in visitor straight into the app instead of
 * showing them marketing/auth pages they have no reason to see (landing
 * page, /login, /signup). Mirrors the onboarding-completion check in
 * `dashboard/layout.tsx`: an unfinished signup resumes onboarding, a
 * finished one goes to the dashboard. No-ops for a signed-out visitor.
 */
export async function redirectIfAuthenticated(): Promise<void> {
  // `redirect()` throws a special Next.js control-flow error that must
  // propagate up uncaught — so the Supabase calls that can genuinely fail
  // (env not configured yet, network hiccup) are isolated in this try block,
  // and the actual redirect() call happens outside it, never swallowed.
  let destination: "/dashboard" | "/onboarding" | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
      destination = profile?.onboarding_completed ? "/dashboard" : "/onboarding";
    }
  } catch {
    // Fall through and render the page as if signed out rather than breaking it.
  }

  if (destination) redirect(destination);
}

/** Whether anyone is currently signed in — used to tweak page content (not to gate access). */
export async function isSignedIn(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}
