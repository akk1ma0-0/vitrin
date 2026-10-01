import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { computeVisitorHash, getClientIp, getCountry, getDeviceType, getReferrerHost } from "@/lib/analytics";
import { checkEventsRateLimit } from "@/lib/services/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const eventSchema = z.object({
  type: z.enum([
    "profile_view",
    "work_expand",
    "work_open_external",
    "hire_click",
    "hire_submit",
    "contact_click",
  ]),
  profileId: z.string().uuid(),
  workId: z.string().uuid().optional(),
  contactType: z.string().max(30).optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { type, profileId, workId, contactType } = parsed.data;
  const userAgent = request.headers.get("user-agent") ?? "";
  const ip = getClientIp(request.headers);
  const ipHash = createHash("sha256").update(ip).digest("hex");
  if (!(await checkEventsRateLimit(ipHash))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    // Don't log the owner viewing their own page (spec section 4).
    const sessionSupabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sessionSupabase.auth.getUser();
    if (user?.id === profileId) {
      return NextResponse.json({ ok: true, skipped: "owner_view" });
    }

    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("events").insert({
      profile_id: profileId,
      work_id: workId ?? null,
      type,
      contact_type: contactType ?? null,
      visitor_hash: computeVisitorHash(ip, userAgent),
      referrer_host: getReferrerHost(request.headers.get("referer")),
      country: getCountry(request.headers),
      device: getDeviceType(userAgent),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Analytics must never break the page; swallow errors (e.g. Supabase not configured yet).
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
