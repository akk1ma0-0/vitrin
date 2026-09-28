import { safeIngestFetch } from "@/lib/ingest/ssrf-guard";
import type { PageMetadata, ScreenshotProvider, ScreenshotResult } from "@/lib/services/screenshot/types";

const API_BASE = "https://api.microlink.io";

interface MicrolinkResponse {
  status: "success" | "error";
  data?: {
    title?: string;
    description?: string;
    image?: { url: string };
    logo?: { url: string };
    publisher?: string;
    screenshot?: { url: string };
  };
}

function buildUrl(url: string, params: Record<string, string>): string {
  const search = new URLSearchParams({ url, ...params });
  const apiKey = process.env.MICROLINK_API_KEY;
  if (apiKey) search.set("apiKey", apiKey);
  return `${API_BASE}?${search.toString()}`;
}

async function fetchImage(url: string): Promise<ScreenshotResult | null> {
  try {
    const res = await safeIngestFetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType: res.headers.get("content-type") ?? "image/png" };
  } catch {
    return null;
  }
}

export const microlinkScreenshotProvider: ScreenshotProvider = {
  async getMetadata(url: string): Promise<PageMetadata | null> {
    try {
      const res = await fetch(buildUrl(url, {}));
      if (!res.ok) return null;
      const json = (await res.json()) as MicrolinkResponse;
      if (json.status !== "success" || !json.data) return null;

      return {
        title: json.data.title,
        description: json.data.description,
        imageUrl: json.data.image?.url,
        faviconUrl: json.data.logo?.url,
        siteName: json.data.publisher,
      };
    } catch {
      return null;
    }
  },

  async captureCover(url: string): Promise<ScreenshotResult | null> {
    const res = await fetch(
      buildUrl(url, {
        screenshot: "true",
        "viewport.width": "1280",
        "viewport.height": "800",
        "meta": "false",
      }),
    );
    if (!res.ok) return null;
    const json = (await res.json()) as MicrolinkResponse;
    const screenshotUrl = json.data?.screenshot?.url;
    return screenshotUrl ? fetchImage(screenshotUrl) : null;
  },

  async captureFullPage(url: string, width: number, maxHeight: number): Promise<ScreenshotResult | null> {
    const res = await fetch(
      buildUrl(url, {
        screenshot: "true",
        fullPage: "true",
        "viewport.width": String(width),
        "meta": "false",
      }),
    );
    if (!res.ok) return null;
    const json = (await res.json()) as MicrolinkResponse;
    const screenshotUrl = json.data?.screenshot?.url;
    if (!screenshotUrl) return null;
    // maxHeight is enforced by the caller cropping/skipping — Microlink doesn't cap height itself.
    void maxHeight;
    return fetchImage(screenshotUrl);
  },
};
