import {
  buildGoogleDocEmbedUrl,
  buildVideoEmbedUrl,
  detectSource,
  type RenderMode,
} from "@/lib/ingest/detect-source";
import { isIframeAllowed } from "@/lib/ingest/iframe-check";
import { normalizeUrl } from "@/lib/ingest/normalize-url";
import { safeIngestFetch } from "@/lib/ingest/ssrf-guard";
import { fetchGithubRepoMeta } from "@/lib/services/github";
import { moderateText } from "@/lib/services/moderation";
import { getScreenshotProvider } from "@/lib/services/screenshot";
import { checkUrlSafety } from "@/lib/services/web-risk";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const FULL_PAGE_WIDTH = 1440;
const FULL_PAGE_MAX_HEIGHT = 15_000;

function buildFigmaEmbedUrl(url: string): string {
  return `https://www.figma.com/embed?embed_host=vitrin&url=${encodeURIComponent(url)}`;
}

async function uploadScreenshot(
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
  } else {
    // website, notion, behance, dribbble, telegram_post, other: check embeddability.
    try {
      const res = await safeIngestFetch(normalizedUrl, { method: "GET" });
      iframeAllowed = res.ok && isIframeAllowed(res.headers);
    } catch {
      iframeAllowed = false;
    }
    renderMode = iframeAllowed ? "live_iframe" : "screenshot";
    if (iframeAllowed) embedUrl = normalizedUrl;
  }

  // Metadata + cover, best-effort for every source type that doesn't already have one.
  if (!title || !description || !coverUrl) {
    const pageMeta = await screenshotProvider.getMetadata(normalizedUrl);
    if (pageMeta) {
      title = title ?? pageMeta.title ?? null;
      description = description ?? pageMeta.description ?? null;
      if (!coverUrl && pageMeta.imageUrl) {
        coverUrl = pageMeta.imageUrl;
        coverSource = "og";
      }
    }
  }

  // Screenshots: always try a cover for card display; full-page only when we'll render in screenshot mode.
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
    const fullPage = await screenshotProvider.captureFullPage(normalizedUrl, FULL_PAGE_WIDTH, FULL_PAGE_MAX_HEIGHT);
    if (fullPage) {
      screenshotUrl = await uploadScreenshot(supabase, work.profile_id, workId, "full", fullPage.buffer, fullPage.contentType);
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
