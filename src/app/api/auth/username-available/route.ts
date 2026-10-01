import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getClientIp } from "@/lib/analytics";
import { validateUsernameFormat } from "@/lib/reserved-usernames";
import { checkUsernameCheckRateLimit } from "@/lib/services/rate-limit";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const ipHash = createHash("sha256").update(ip).digest("hex");
  if (!(await checkUsernameCheckRateLimit(ipHash))) {
    return NextResponse.json({ available: false, error: "rate_limited" }, { status: 429 });
  }

  const username = request.nextUrl.searchParams.get("username") ?? "";

  const format = validateUsernameFormat(username);
  if (!format.valid) {
    return NextResponse.json({ available: false, error: format.error });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    return NextResponse.json({ available: !data });
  } catch {
    return NextResponse.json({ available: false, error: "lookup_failed" }, { status: 503 });
  }
}
