import { microlinkScreenshotProvider } from "@/lib/services/screenshot/microlink";
import type { ScreenshotProvider } from "@/lib/services/screenshot/types";

export type { PageMetadata, ScreenshotProvider, ScreenshotResult } from "@/lib/services/screenshot/types";

const PROVIDERS: Record<string, ScreenshotProvider> = {
  microlink: microlinkScreenshotProvider,
};

export function getScreenshotProvider(): ScreenshotProvider {
  const key = process.env.SCREENSHOT_PROVIDER ?? "microlink";
  return PROVIDERS[key] ?? microlinkScreenshotProvider;
}
