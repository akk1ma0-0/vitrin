/**
 * Behind this interface so Microlink can be swapped for ScreenshotOne or a
 * self-hosted Playwright worker (spec section 1 / stage 3) without touching
 * ingest logic.
 */
export interface PageMetadata {
  title?: string;
  description?: string;
  imageUrl?: string;
  faviconUrl?: string;
  siteName?: string;
}

export interface ScreenshotResult {
  /** Buffer of a PNG/JPEG image. */
  buffer: Buffer;
  contentType: string;
}

export interface ScreenshotProvider {
  getMetadata(url: string): Promise<PageMetadata | null>;
  /** Viewport-sized cover screenshot (1280x800). */
  captureCover(url: string): Promise<ScreenshotResult | null>;
  /** Full-page screenshot at a fixed width, capped in height (spec section 5.3). */
  captureFullPage(url: string, width: number, maxHeight: number): Promise<ScreenshotResult | null>;
}
