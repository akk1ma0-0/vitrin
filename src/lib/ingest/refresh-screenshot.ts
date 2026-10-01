import { DEVICE_WIDTHS } from "@/lib/device-widths";
import { FULL_PAGE_MAX_HEIGHT, uploadScreenshot } from "@/lib/ingest/process-work";
import { getScreenshotProvider } from "@/lib/services/screenshot";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Periodic screenshot re-capture (spec section 9) for works stuck in
 * screenshot mode — the live site keeps changing after the initial ingest,
 * so the capture goes stale. Deliberately its own job type, separate from
 * recheck-link.ts, so a routine reachability check doesn't also mean a
 * Microlink call for every screenshot-mode work every time it runs.
 */
export async function refreshScreenshot(workId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: work, error } = await supabase.from("works").select("*").eq("id", workId).single();
  if (error || !work || !work.source_url || work.render_mode !== "screenshot") return;

  const screenshotProvider = getScreenshotProvider();
  const devices = Object.entries(DEVICE_WIDTHS) as [keyof typeof DEVICE_WIDTHS, number][];
  const captures = await Promise.all(
    devices.map(([, width]) => screenshotProvider.captureFullPage(work.source_url!, width, FULL_PAGE_MAX_HEIGHT)),
  );

  const screenshots: Record<string, string> = {};
  for (let i = 0; i < devices.length; i++) {
    const [device] = devices[i];
    const capture = captures[i];
    if (!capture) continue;
    const uploaded = await uploadScreenshot(supabase, work.profile_id, workId, `full-${device}`, capture.buffer, capture.contentType);
    if (uploaded) screenshots[device] = uploaded;
  }

  // Capture failed entirely (e.g. the provider is down) — keep the existing
  // screenshots rather than wiping them on a transient failure.
  if (Object.keys(screenshots).length === 0) return;

  const baseMeta = typeof work.meta === "object" && work.meta !== null && !Array.isArray(work.meta) ? work.meta : {};
  const meta: Json = { ...baseMeta, screenshots };

  // Only refresh the card cover if it was our own capture — leave a custom
  // upload or a scraped og:image alone.
  let coverUrl = work.cover_url;
  if (work.cover_source === "screenshot") {
    const cover = await screenshotProvider.captureCover(work.source_url);
    if (cover) {
      const uploaded = await uploadScreenshot(supabase, work.profile_id, workId, "cover", cover.buffer, cover.contentType);
      if (uploaded) coverUrl = uploaded;
    }
  }

  await supabase
    .from("works")
    .update({
      screenshot_url: screenshots.desktop ?? work.screenshot_url,
      cover_url: coverUrl,
      meta,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", workId);
}
