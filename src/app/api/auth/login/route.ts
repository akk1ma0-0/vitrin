import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getClientIp } from "@/lib/analytics";
import { checkLoginRateLimit } from "@/lib/services/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/**
 * Login by username (spec section 5.1): resolves the username's email
 * server-side via the service-role client without ever exposing it to the
 * browser, then signs in through the request-scoped client so the session
 * cookies land on this response.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const ipHash = createHash("sha256").update(ip).digest("hex");
  if (!(await checkLoginRateLimit(ipHash))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const admin = createSupabaseServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const { data: userResponse, error: userError } = await admin.auth.admin.getUserById(profile.id);
  if (userError || !userResponse.user?.email) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userResponse.user.email,
    password,
  });

  if (signInError) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
