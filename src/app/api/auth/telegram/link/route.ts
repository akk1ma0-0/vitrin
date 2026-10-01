import { NextResponse, type NextRequest } from "next/server";

import { verifyTelegramAuth } from "@/lib/auth/telegram";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Telegram Login Widget redirect target for the "connect Telegram" button
 * in /dashboard/profile (as opposed to /api/auth/telegram, which signs an
 * anonymous visitor in). Same signed-payload verification, but instead of
 * mapping to a (possibly new) user via a synthetic email, it just attaches
 * the Telegram id to the already-signed-in user's own profile row — RLS's
 * "users can update their own profile" policy already allows this, so no
 * service-role client is needed here.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard/profile";
  const fail = (reason: string) => NextResponse.redirect(`${origin}${next}?telegram_error=${reason}`);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return fail("not_configured");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("unauthorized");

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== "next") params[key] = value;
  });

  const auth = verifyTelegramAuth(params, botToken);
  if (!auth) return fail("invalid_signature");

  const telegramId = Number(auth.id);
  if (!Number.isSafeInteger(telegramId)) return fail("invalid_signature");

  const { error } = await supabase.from("profiles").update({ telegram_id: telegramId }).eq("id", user.id);
  if (error) {
    return fail(error.code === "23505" ? "already_linked" : "update_failed");
  }

  return NextResponse.redirect(`${origin}${next}?telegram_linked=1`);
}
