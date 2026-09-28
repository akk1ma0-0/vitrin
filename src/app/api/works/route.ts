import { NextResponse, type NextRequest } from "next/server";

import { bulkLinksSchema } from "@/lib/validation/schemas";
import { canAddWork, getPlanLimits } from "@/lib/plans";
import { normalizeUrl, InvalidUrlError } from "@/lib/ingest/normalize-url";
import { uniqueSlug } from "@/lib/slug";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

/** Fire-and-forget kick of the job processor right after creating works, instead of waiting for the next cron minute. */
function kickJobProcessor() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const secret = process.env.CRON_SECRET;
  void fetch(`${siteUrl}/api/cron/process-jobs`, {
    method: "POST",
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  }).catch(() => {});
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("profile_id", user.id)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  return NextResponse.json({ works: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bulkLinksSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const plan = profile?.plan ?? "free";

  const { count: currentCount } = await supabase
    .from("works")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id);

  const { data: existingSlugRows } = await supabase.from("works").select("slug").eq("profile_id", user.id);
  const existingSlugs = new Set((existingSlugRows ?? []).map((w) => w.slug));

  const admin = createSupabaseServiceRoleClient();
  const created: string[] = [];
  const rejected: Array<{ link: string; reason: string }> = [];
  let runningCount = currentCount ?? 0;

  for (const rawLink of parsed.data.links) {
    if (!canAddWork(plan, runningCount)) {
      rejected.push({ link: rawLink, reason: "plan_limit_reached" });
      continue;
    }

    let normalized: string;
    try {
      normalized = normalizeUrl(rawLink);
    } catch (err) {
      rejected.push({ link: rawLink, reason: err instanceof InvalidUrlError ? err.message : "invalid_url" });
      continue;
    }

    const slug = uniqueSlug(new URL(normalized).hostname, existingSlugs);
    existingSlugs.add(slug);

    const { data: work, error: insertError } = await admin
      .from("works")
      .insert({
        profile_id: user.id,
        slug,
        position: runningCount,
        source_url: normalized,
        ingest_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !work) {
      rejected.push({ link: rawLink, reason: "insert_failed" });
      continue;
    }

    await admin.from("jobs").insert({ type: "ingest_work", payload: { workId: work.id } });

    created.push(work.id);
    runningCount++;
  }

  if (created.length > 0) kickJobProcessor();

  return NextResponse.json({
    created,
    rejected,
    limit: getPlanLimits(plan).maxWorks,
  });
}
