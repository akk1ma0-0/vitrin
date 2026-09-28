import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { hireRequestSchema } from "@/lib/validation/schemas";
import { getClientIp } from "@/lib/analytics";
import { verifyTurnstileToken } from "@/lib/services/turnstile";
import { checkHireRateLimit } from "@/lib/services/rate-limit";
import { moderateText } from "@/lib/services/moderation";
import { sendEmail } from "@/lib/services/email/send";
import { HireRequestEmail } from "@/lib/services/email/hire-request-email";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = hireRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }

  const input = parsed.data;

  // Honeypot: a real visitor never fills this hidden field in.
  if (input.website) {
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(request.headers);
  const ipHash = createHash("sha256").update(ip).digest("hex");

  const turnstileOk = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
  }

  const rateLimit = await checkHireRateLimit(ipHash, input.profileId);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, email_verified, contacts, username")
    .eq("id", input.profileId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }
  if (!profile.email_verified) {
    return NextResponse.json({ error: "freelancer_email_not_verified" }, { status: 403 });
  }

  const moderation = await moderateText(input.message);
  const status = moderation.flagged ? "spam" : "new";

  const { error: insertError } = await supabase.from("hire_requests").insert({
    profile_id: input.profileId,
    work_id: input.workId ?? null,
    name: input.name,
    email: input.email,
    budget: input.budget ?? null,
    message: input.message,
    locale: input.locale,
    status,
    ip_hash: ipHash,
  });

  if (insertError) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  const contacts = (profile.contacts ?? {}) as { email?: string };
  const freelancerEmail = contacts.email;

  if (!moderation.flagged && freelancerEmail) {
    await sendEmail({
      to: freelancerEmail,
      subject: `New request from ${input.name}`,
      replyTo: input.email,
      react: (
        <HireRequestEmail
          freelancerName={profile.display_name ?? profile.username ?? "there"}
          clientName={input.name}
          clientEmail={input.email}
          budget={input.budget}
          message={input.message}
          profileUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard/inbox`}
        />
      ),
    });
  }

  await supabase.from("events").insert({
    profile_id: input.profileId,
    work_id: input.workId ?? null,
    type: "hire_submit",
    visitor_hash: ipHash,
    device: null,
  });

  return NextResponse.json({ ok: true });
}
