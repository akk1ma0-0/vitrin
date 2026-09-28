import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { reportSchema } from "@/lib/validation/schemas";
import { getClientIp } from "@/lib/analytics";
import { verifyTurnstileToken } from "@/lib/services/turnstile";
import { checkReportRateLimit } from "@/lib/services/rate-limit";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const input = parsed.data;
  const ip = getClientIp(request.headers);
  const ipHash = createHash("sha256").update(ip).digest("hex");

  const turnstileOk = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
  }

  const allowed = await checkReportRateLimit(ipHash);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const supabase = createSupabaseServiceRoleClient();

  await supabase.from("reports").insert({
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    details: input.details ?? null,
    reporter_email: input.reporterEmail ?? null,
    reporter_hash: ipHash,
  });

  // Auto-hide after 3+ open reports from distinct reporters (spec section 8.3).
  const { count } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("status", "open");

  if ((count ?? 0) >= 3) {
    if (input.targetType === "profile") {
      await supabase.from("profiles").update({ status: "hidden" }).eq("id", input.targetId);
    } else {
      await supabase.from("works").update({ moderation_status: "flagged" }).eq("id", input.targetId);
    }
  }

  return NextResponse.json({ ok: true });
}
