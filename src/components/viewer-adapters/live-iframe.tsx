"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ScaledFrame } from "@/components/portfolio/scaled-frame";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeviceKey } from "@/components/portfolio/device-switcher";
import { DEVICE_WIDTHS } from "@/components/portfolio/device-switcher";

const LOAD_TIMEOUT_MS = 10_000;
const FRAME_HEIGHT = 900;

export function LiveIframe({
  url,
  device,
  onFallbackToScreenshot,
}: {
  url: string;
  device: DeviceKey;
  onFallbackToScreenshot: () => void;
}) {
  const t = useTranslations("viewer");
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Resetting on url/device change (rather than via a `key` remount) keeps
    // the load-timeout timer's cleanup simple; only the timer callback sets
    // state asynchronously, the resets below just mirror the new url/device.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoaded(false);
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [url, device]);

  return (
    <div className="relative">
      {!loaded && !timedOut && (
        <Skeleton className="absolute inset-0 z-10 mx-auto" style={{ maxWidth: DEVICE_WIDTHS[device] }} />
      )}

      {timedOut && !loaded ? (
        <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">{t("loadFailed")}</p>
          <Button variant="secondary" onClick={onFallbackToScreenshot}>
            {t("showScreenshot")}
          </Button>
        </div>
      ) : (
        <ScaledFrame deviceWidth={DEVICE_WIDTHS[device]} height={FRAME_HEIGHT}>
          <iframe
            src={url}
            title={url}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        </ScaledFrame>
      )}
    </div>
  );
}
