import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getClientIp } from "@/lib/analytics";
import { verifyTelegramAuth } from "@/lib/auth/telegram";
import { checkLoginRateLimit } from "@/lib/services/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

/**
 * Telegram Login Widget redirect target (`data-auth-url` mode, so no global
 * JS callback is needed). Supabase Auth has no native Telegram provider, so
 * this bridges it in manually: verify the widget's signed payload, then use
 * a deterministic per-Telegram-ID email so the same Telegram account always
 * maps to the same Supabase user. `generateLink` creates that user on first
 * login (spec: it "handles the creation of the user for ... magiclink") and
 * returns a token we immediately verify server-side to set session cookies
 * — the user never sees an email or a link to click.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const fail = () => NextResponse.redirect(`${origin}/en/login?error=auth_failed`);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return fail();

  const ip = getClientIp(request.headers);
  const ipHash = createHash("sha256").update(ip).digest("hex");
  if (!(await checkLoginRateLimit(ipHash))) return fail();

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== "next") params[key] = value;
  });

  const auth = verifyTelegramAuth(params, botToken);
  if (!auth) return fail();

  const telegramId = Number(auth.id);
  if (!Number.isSafeInteger(telegramId)) return fail();

  const email = `telegram-${telegramId}@users.vitrin.work`;
  const fullName = [auth.first_name, auth.last_name].filter(Boolean).join(" ") || undefined;

  const admin = createSupabaseServiceRoleClient();
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { data: { full_name: fullName, avatar_url: auth.photo_url } },
  });
  if (linkError || !link.user) return fail();

  await admin.from("profiles").update({ telegram_id: telegramId }).eq("id", link.user.id);

  const supabase = await createSupabaseServerClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "email",
  });
  if (verifyError) return fail();

  return NextResponse.redirect(`${origin}${next}`);
}
