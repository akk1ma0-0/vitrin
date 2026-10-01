import {
  buildGoogleDocEmbedUrl,
  buildTelegramEmbedUrl,
  buildVideoEmbedUrl,
  detectSource,
  type RenderMode,
} from "@/lib/ingest/detect-source";
import { DEVICE_WIDTHS } from "@/lib/device-widths";
import { isIframeAllowed } from "@/lib/ingest/iframe-check";
import { normalizeUrl } from "@/lib/ingest/normalize-url";
import { safeIngestFetch } from "@/lib/ingest/ssrf-guard";
import { fetchGithubRepoMeta } from "@/lib/services/github";
import { moderateText } from "@/lib/services/moderation";
import { getScreenshotProvider } from "@/lib/services/screenshot";
import { checkUrlSafety } from "@/lib/services/web-risk";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export const FULL_PAGE_MAX_HEIGHT = 15_000;

function buildFigmaEmbedUrl(url: string): string {
  return `https://www.figma.com/embed?embed_host=vitrin&url=${encodeURIComponent(url)}`;
}

export async function uploadScreenshot(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  profileId: string,
  workId: string,
  suffix: string,
  buffer: Buffer,
  contentType: string,
): Promise<string | null> {
  const ext = contentType.includes("jpeg") ? "jpg" : "png";
  const path = `${profileId}/${workId}-${suffix}.${ext}`;

  const { error } = await supabase.storage
    .from("screenshots")
    .upload(path, buffer, { contentType, upsert: true });
  if (error) return null;

  const { data } = supabase.storage.from("screenshots").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Runs the full ingest pipeline for one work (spec section 5.3). Throws on
 * unrecoverable errors so the job queue can retry with backoff; the queue
 * caller is responsible for catching and recording `last_error`.
 */
export async function processWork(workId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: work, error: fetchError } = await supabase
    .from("works")
    .select("*")
    .eq("id", workId)
    .single();

  if (fetchError || !work) throw new Error(`work_not_found:${workId}`);
  if (!work.source_url) {
    // Uploaded files don't go through link ingest; nothing to do.
    await supabase.from("works").update({ ingest_status: "ready" }).eq("id", workId);
    return;
  }

  await supabase.from("works").update({ ingest_status: "processing" }).eq("id", workId);

  const normalizedUrl = normalizeUrl(work.source_url);
  const url = new URL(normalizedUrl);

  const safety = await checkUrlSafety(normalizedUrl);
  if (safety === "unsafe") {
    await supabase
      .from("works")
      .update({ safety_status: "unsafe", ingest_status: "failed", last_checked_at: new Date().toISOString() })
      .eq("id", workId);
    return;
  }

  const { sourceType, defaultRenderMode } = detectSource(url);
  const screenshotProvider = getScreenshotProvider();

  let renderMode: RenderMode = defaultRenderMode;
  let embedUrl: string | null = null;
  let coverUrl: string | null = work.cover_url;
  let coverSource: "custom" | "og" | "screenshot" | null = work.cover_source;
  let screenshotUrl: string | null = null;
  let iframeAllowed = false;
  let meta: Json = work.meta;
  let title = work.title;
  let description = work.description;

  if (sourceType === "figma") {
    embedUrl = buildFigmaEmbedUrl(normalizedUrl);
  } else if (sourceType === "github") {
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    const githubMeta = owner && repo ? await fetchGithubRepoMeta(owner, repo) : null;
    if (githubMeta) {
      meta = githubMeta as unknown as Json;
      title = title ?? `${owner}/${repo}`;
      description = description ?? githubMeta.description ?? null;
    }
  } else if (sourceType === "youtube" || sourceType === "vimeo" || sourceType === "loom") {
    embedUrl = buildVideoEmbedUrl(sourceType, url);
  } else if (sourceType === "google_doc" || sourceType === "google_slides") {
    embedUrl = buildGoogleDocEmbedUrl(sourceType, url);
  } else if (sourceType === "telegram_post") {
    // Telegram's own embeddable post widget — the plain post page blocks
    // framing, so this is never the generic iframe-check branch below.
    embedUrl = buildTelegramEmbedUrl(url);
    if (!embedUrl) renderMode = "screenshot"; // malformed URL (e.g. just /channel, no post id)
  } else if (sourceType === "dribbble") {
    // Dribbble shots are image-first; the OG image fetched below (always
    // trusted here since renderMode isn't "screenshot") is the shot's own
    // preview image, which the gallery viewer shows as the cover. Skip the
    // iframe-check entirely — Dribbble blocks framing anyway, and a
    // screenshot of the page is a worse result than the shot image itself.
  } else {
    // website, notion, behance, other: check embeddability.
    try {
      const res = await safeIngestFetch(normalizedUrl, { method: "GET" });
      iframeAllowed = res.ok && isIframeAllowed(res.headers);
    } catch {
      iframeAllowed = false;
    }
    renderMode = iframeAllowed ? "live_iframe" : "screenshot";
    if (iframeAllowed) embedUrl = normalizedUrl;
  }

  // Metadata (title/description) best-effort for every source type missing them.
  if (!title || !description || !coverUrl) {
    const pageMeta = await screenshotProvider.getMetadata(normalizedUrl);
    if (pageMeta) {
      title = title ?? pageMeta.title ?? null;
      description = description ?? pageMeta.description ?? null;
      // Only trust the scraped og:image as the cover when we won't capture our
      // own homepage screenshot below. A site's og:image can be an unrelated
      // asset (a payment-provider logo, a generic social card, ...) — for
      // anything rendering in screenshot mode, our own capture of the actual
      // page is a more faithful thumbnail, and matches what "expand" shows.
      if (!coverUrl && pageMeta.imageUrl && renderMode !== "screenshot") {
        coverUrl = pageMeta.imageUrl;
        coverSource = "og";
      }
    }
  }

  // Cover for card display: our own screenshot when we don't already have a
  // trustworthy one (see above).
  if (!coverUrl || coverSource === "screenshot") {
    const cover = await screenshotProvider.captureCover(normalizedUrl);
    if (cover) {
      const uploaded = await uploadScreenshot(supabase, work.profile_id, workId, "cover", cover.buffer, cover.contentType);
      if (uploaded) {
        coverUrl = uploaded;
        coverSource = "screenshot";
      }
    }
  }

  if (renderMode === "screenshot") {
    // The real site can't be embedded live (blocked framing), so the viewer
    // shows a static capture instead. Capture one per device width so the
    // device switcher actually reflects the site's real responsive layout
    // instead of just resizing a single desktop-width image.
    const devices = Object.entries(DEVICE_WIDTHS) as [keyof typeof DEVICE_WIDTHS, number][];
    const captures = await Promise.all(
      devices.map(([, width]) => screenshotProvider.captureFullPage(normalizedUrl, width, FULL_PAGE_MAX_HEIGHT)),
    );

    const screenshots: Record<string, string> = {};
    for (let i = 0; i < devices.length; i++) {
      const [device] = devices[i];
      const capture = captures[i];
      if (!capture) continue;
      const uploaded = await uploadScreenshot(supabase, work.profile_id, workId, `full-${device}`, capture.buffer, capture.contentType);
      if (uploaded) screenshots[device] = uploaded;
    }

    screenshotUrl = screenshots.desktop ?? null;
    if (Object.keys(screenshots).length > 0) {
      const baseMeta = typeof meta === "object" && meta !== null && !Array.isArray(meta) ? meta : {};
      meta = { ...baseMeta, screenshots };
    }
  }

  const moderation = await moderateText(`${title ?? ""} ${description ?? ""}`);

  await supabase
    .from("works")
    .update({
      source_url: normalizedUrl,
      source_type: sourceType,
      render_mode: renderMode,
      embed_url: embedUrl,
      title,
      description,
      cover_url: coverUrl,
      cover_source: coverSource,
      screenshot_url: screenshotUrl,
      meta,
      iframe_allowed: iframeAllowed,
      safety_status: "safe",
      moderation_status: moderation.flagged ? "flagged" : "approved",
      ingest_status: "ready",
      is_broken: false,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", workId);
}
