import { isIframeAllowed } from "@/lib/ingest/iframe-check";
import { safeIngestFetch } from "@/lib/ingest/ssrf-guard";
import { BrokenLinkEmail } from "@/lib/services/email/broken-link-email";
import { sendEmail } from "@/lib/services/email/send";
import { checkUrlSafety } from "@/lib/services/web-risk";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type WorkUpdate = Database["public"]["Tables"]["works"]["Update"];

async function notifyOwnerOfBrokenLink(work: {
  profile_id: string;
  title: string | null;
  source_url: string | null;
}): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", work.profile_id)
    .single();
  if (!profile) return;

  const { data: userResponse } = await supabase.auth.admin.getUserById(work.profile_id);
  const email = userResponse.user?.email;
  if (!email || !work.source_url) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitrin.work";
  await sendEmail({
    to: email,
    subject: "A link on your Vitrin page looks broken",
    react: BrokenLinkEmail({
      freelancerName: profile.display_name ?? profile.username ?? "there",
      workTitle: work.title,
      sourceUrl: work.source_url,
      dashboardUrl: `${siteUrl}/dashboard/works`,
    }),
  });
}

/**
 * Periodic link health check (spec section 9): reachability (HTTP 2xx/3xx),
 * Web Risk safety, and iframe-header re-check — all lighter-weight than a
 * full re-ingest (processWork()), which is why this is its own job type
 * instead of just re-running that. Screenshot re-capture is a separate job
 * (refresh-screenshot.ts) so a daily recheck doesn't also mean a daily
 * Microlink call for every screenshot-mode work.
 */
export async function recheckLink(workId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: work, error } = await supabase.from("works").select("*").eq("id", workId).single();
  if (error || !work || !work.source_url) return; // nothing to recheck for an upload-based work

  const safety = await checkUrlSafety(work.source_url);
  if (safety === "unsafe") {
    const wasAlreadyBroken = work.is_broken;
    await supabase
      .from("works")
      .update({ safety_status: "unsafe", is_broken: true, last_checked_at: new Date().toISOString() })
      .eq("id", workId);
    if (!wasAlreadyBroken) await notifyOwnerOfBrokenLink(work);
    return;
  }

  let reachable = false;
  let iframeAllowed = work.iframe_allowed;
  try {
    const res = await safeIngestFetch(work.source_url, { method: "GET" });
    reachable = res.ok;
    if (reachable) iframeAllowed = isIframeAllowed(res.headers);
  } catch {
    reachable = false;
  }

  const updates: WorkUpdate = {
    is_broken: !reachable,
    last_checked_at: new Date().toISOString(),
  };

  // Only flip render mode for the source types that chose it dynamically in
  // the first place, and only when embeddability actually changed.
  const dynamicRenderMode = work.render_mode === "live_iframe" || work.render_mode === "screenshot";
  if (reachable && dynamicRenderMode && iframeAllowed !== work.iframe_allowed) {
    updates.iframe_allowed = iframeAllowed;
    updates.render_mode = iframeAllowed ? "live_iframe" : "screenshot";
    if (iframeAllowed) updates.embed_url = work.source_url;
  }

  await supabase.from("works").update(updates).eq("id", workId);

  // Only email on the transition into "broken", not every day it stays broken.
  if (!reachable && !work.is_broken) {
    await notifyOwnerOfBrokenLink(work);
  }
}
