import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import type { DeviceKey } from "@/components/portfolio/device-switcher";
import { DEVICE_WIDTHS } from "@/components/portfolio/device-switcher";

export function ScreenshotScroller({
  url,
  device,
  screenshots,
  sourceUrl,
}: {
  /** Fallback single capture, used for devices without their own entry in `screenshots`. */
  url: string;
  device: DeviceKey;
  /** Per-device captures, when the ingest pipeline took one per width. */
  screenshots?: Partial<Record<DeviceKey, string>> | null;
  sourceUrl?: string | null;
}) {
  const t = useTranslations("viewer");
  const src = screenshots?.[device] ?? url;

  return (
    <div className="mx-auto flex flex-col gap-2" style={{ maxWidth: DEVICE_WIDTHS[device] }}>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("staticPreviewNote")}
        </a>
      )}
      <div className="max-h-[75vh] overflow-y-auto rounded-lg border border-border">
        <Image
          key={src}
          src={src}
          alt=""
          width={DEVICE_WIDTHS[device]}
          height={DEVICE_WIDTHS[device] * 2}
          className="h-auto w-full"
          unoptimized
        />
      </div>
    </div>
  );
}
