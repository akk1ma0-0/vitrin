import Image from "next/image";

import type { DeviceKey } from "@/components/portfolio/device-switcher";
import { DEVICE_WIDTHS } from "@/components/portfolio/device-switcher";

export function ScreenshotScroller({ url, device }: { url: string; device: DeviceKey }) {
  return (
    <div className="mx-auto max-h-[75vh] overflow-y-auto rounded-lg border border-border" style={{ maxWidth: DEVICE_WIDTHS[device] }}>
      <Image
        src={url}
        alt=""
        width={DEVICE_WIDTHS[device]}
        height={DEVICE_WIDTHS[device] * 2}
        className="h-auto w-full"
        unoptimized
      />
    </div>
  );
}
