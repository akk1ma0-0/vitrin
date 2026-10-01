/**
 * Maps a normalized URL to a `source_type` / `render_mode` pair per the
 * adapter table in spec section 5.3. Pure function, no network calls —
 * keep it that way so it stays unit-testable.
 */

export type SourceType =
  | "website"
  | "figma"
  | "github"
  | "youtube"
  | "vimeo"
  | "loom"
  | "google_doc"
  | "google_slides"
  | "notion"
  | "telegram_post"
  | "behance"
  | "dribbble"
  | "upload_image"
  | "upload_video"
  | "upload_pdf"
  | "other";

export type RenderMode =
  | "live_iframe"
  | "embed"
  | "github_card"
  | "screenshot"
  | "video"
  | "pdf"
  | "gallery";

export interface DetectedSource {
  sourceType: SourceType;
  /** render mode when it can be decided from the URL alone; `website`/`notion` need the iframe-header check first */
  defaultRenderMode: RenderMode;
}

function hostMatches(hostname: string, ...suffixes: string[]): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return suffixes.some((s) => host === s || host.endsWith(`.${s}`));
}

export function detectSource(url: URL): DetectedSource {
  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (hostMatches(host, "figma.com") && /^\/(file|design|proto|board)\//.test(path)) {
    return { sourceType: "figma", defaultRenderMode: "embed" };
  }

  if (hostMatches(host, "github.com")) {
    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return { sourceType: "github", defaultRenderMode: "github_card" };
    }
  }

  if (
    hostMatches(host, "youtube.com", "youtube-nocookie.com") &&
    (path === "/watch" || path.startsWith("/shorts/"))
  ) {
    return { sourceType: "youtube", defaultRenderMode: "video" };
  }
  if (hostMatches(host, "youtu.be")) {
    return { sourceType: "youtube", defaultRenderMode: "video" };
  }

  if (hostMatches(host, "vimeo.com") && /^\/\d+/.test(path)) {
    return { sourceType: "vimeo", defaultRenderMode: "video" };
  }

  if (hostMatches(host, "loom.com") && path.startsWith("/share/")) {
    return { sourceType: "loom", defaultRenderMode: "video" };
  }

  if (hostMatches(host, "docs.google.com")) {
    if (path.startsWith("/document/")) {
      return { sourceType: "google_doc", defaultRenderMode: "embed" };
    }
    if (path.startsWith("/presentation/")) {
      return { sourceType: "google_slides", defaultRenderMode: "embed" };
    }
  }

  if (hostMatches(host, "notion.site", "notion.so")) {
    return { sourceType: "notion", defaultRenderMode: "screenshot" };
  }

  if (hostMatches(host, "t.me") || hostMatches(host, "telegram.me")) {
    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return { sourceType: "telegram_post", defaultRenderMode: "embed" };
    }
  }

  if (hostMatches(host, "behance.net")) {
    return { sourceType: "behance", defaultRenderMode: "screenshot" };
  }

  if (hostMatches(host, "dribbble.com")) {
    return { sourceType: "dribbble", defaultRenderMode: "gallery" };
  }

  return { sourceType: "website", defaultRenderMode: "screenshot" };
}

/** Extracts an embeddable player URL for video-type sources. Returns null if the URL shape is unexpected. */
export function buildVideoEmbedUrl(sourceType: SourceType, url: URL): string | null {
  if (sourceType === "youtube") {
    const id =
      url.hostname.includes("youtu.be")
        ? url.pathname.slice(1)
        : url.pathname.startsWith("/shorts/")
          ? url.pathname.split("/")[2]
          : url.searchParams.get("v");
    if (!id) return null;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }

  if (sourceType === "vimeo") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (!id) return null;
    return `https://player.vimeo.com/video/${id}`;
  }

  if (sourceType === "loom") {
    const id = url.pathname.split("/").filter(Boolean)[1];
    if (!id) return null;
    return `https://www.loom.com/embed/${id}`;
  }

  return null;
}

export function buildGoogleDocEmbedUrl(sourceType: SourceType, url: URL): string | null {
  if (sourceType !== "google_doc" && sourceType !== "google_slides") return null;
  const base = url.origin + url.pathname.replace(/\/(edit|view|preview).*$/, "");
  return sourceType === "google_slides" ? `${base}/embed` : `${base}/preview`;
}

/**
 * Telegram's public post widget: the plain post page (t.me/{channel}/{id})
 * sends framing headers that block embedding, but the same URL with
 * `?embed=1` is Telegram's own embeddable variant, designed to be iframed —
 * see https://core.telegram.org/widgets/post.
 */
export function buildTelegramEmbedUrl(url: URL): string | null {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const [channel, postId] = segments;
  return `https://t.me/${channel}/${postId}?embed=1`;
}
