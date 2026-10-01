import { describe, expect, it } from "vitest";

import { buildTelegramEmbedUrl, buildVideoEmbedUrl, detectSource } from "@/lib/ingest/detect-source";

describe("detectSource", () => {
  it("detects a figma prototype", () => {
    const result = detectSource(new URL("https://www.figma.com/proto/abc123/My-Project"));
    expect(result).toEqual({ sourceType: "figma", defaultRenderMode: "embed" });
  });

  it("detects a github repo", () => {
    const result = detectSource(new URL("https://github.com/octocat/hello-world"));
    expect(result).toEqual({ sourceType: "github", defaultRenderMode: "github_card" });
  });

  it("does not treat a bare github profile as a repo", () => {
    const result = detectSource(new URL("https://github.com/octocat"));
    expect(result.sourceType).toBe("website");
  });

  it("detects youtube watch URLs", () => {
    const result = detectSource(new URL("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
    expect(result).toEqual({ sourceType: "youtube", defaultRenderMode: "video" });
  });

  it("detects youtu.be short links", () => {
    const result = detectSource(new URL("https://youtu.be/dQw4w9WgXcQ"));
    expect(result.sourceType).toBe("youtube");
  });

  it("detects vimeo", () => {
    const result = detectSource(new URL("https://vimeo.com/123456789"));
    expect(result).toEqual({ sourceType: "vimeo", defaultRenderMode: "video" });
  });

  it("detects loom", () => {
    const result = detectSource(new URL("https://www.loom.com/share/abcdef1234"));
    expect(result).toEqual({ sourceType: "loom", defaultRenderMode: "video" });
  });

  it("detects google docs", () => {
    const result = detectSource(new URL("https://docs.google.com/document/d/abc/edit"));
    expect(result).toEqual({ sourceType: "google_doc", defaultRenderMode: "embed" });
  });

  it("detects a notion page", () => {
    const result = detectSource(new URL("https://my-workspace.notion.site/My-Page-abc123"));
    expect(result).toEqual({ sourceType: "notion", defaultRenderMode: "screenshot" });
  });

  it("detects a telegram channel post", () => {
    const result = detectSource(new URL("https://t.me/somechannel/123"));
    expect(result).toEqual({ sourceType: "telegram_post", defaultRenderMode: "embed" });
  });

  it("does not treat a bare telegram channel as a post", () => {
    const result = detectSource(new URL("https://t.me/somechannel"));
    expect(result.sourceType).toBe("website");
  });

  it("detects a behance project", () => {
    const result = detectSource(new URL("https://www.behance.net/gallery/123456/My-Project"));
    expect(result).toEqual({ sourceType: "behance", defaultRenderMode: "screenshot" });
  });

  it("detects a dribbble shot", () => {
    const result = detectSource(new URL("https://dribbble.com/shots/123456-My-Shot"));
    expect(result).toEqual({ sourceType: "dribbble", defaultRenderMode: "gallery" });
  });

  it("falls back to website for anything else", () => {
    const result = detectSource(new URL("https://example.com/my-portfolio"));
    expect(result).toEqual({ sourceType: "website", defaultRenderMode: "screenshot" });
  });
});

describe("buildVideoEmbedUrl", () => {
  it("builds a youtube-nocookie embed from a watch URL", () => {
    const url = buildVideoEmbedUrl("youtube", new URL("https://www.youtube.com/watch?v=abc123"));
    expect(url).toBe("https://www.youtube-nocookie.com/embed/abc123");
  });

  it("builds a youtube-nocookie embed from a short URL", () => {
    const url = buildVideoEmbedUrl("youtube", new URL("https://youtu.be/abc123"));
    expect(url).toBe("https://www.youtube-nocookie.com/embed/abc123");
  });

  it("builds a vimeo player URL", () => {
    const url = buildVideoEmbedUrl("vimeo", new URL("https://vimeo.com/123456789"));
    expect(url).toBe("https://player.vimeo.com/video/123456789");
  });

  it("builds a loom embed URL", () => {
    const url = buildVideoEmbedUrl("loom", new URL("https://www.loom.com/share/abcdef1234"));
    expect(url).toBe("https://www.loom.com/embed/abcdef1234");
  });
});

describe("buildTelegramEmbedUrl", () => {
  it("builds the embeddable widget URL for a channel post", () => {
    const url = buildTelegramEmbedUrl(new URL("https://t.me/somechannel/123"));
    expect(url).toBe("https://t.me/somechannel/123?embed=1");
  });

  it("returns null for a bare channel URL with no post id", () => {
    const url = buildTelegramEmbedUrl(new URL("https://t.me/somechannel"));
    expect(url).toBeNull();
  });
});
