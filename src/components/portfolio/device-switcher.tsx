"use client";

import { Laptop, Smartphone, Tablet } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type DeviceKey = "desktop" | "tablet" | "mobile";

export const DEVICE_WIDTHS: Record<DeviceKey, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 390,
};

const DEVICE_ICONS: Record<DeviceKey, typeof Laptop> = {
  desktop: Laptop,
  tablet: Tablet,
  mobile: Smartphone,
};

export function DeviceSwitcher({
  value,
  onChange,
}: {
  value: DeviceKey;
  onChange: (device: DeviceKey) => void;
}) {
  const t = useTranslations("viewer.device");

  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl bg-surface p-1">
      {(Object.keys(DEVICE_WIDTHS) as DeviceKey[]).map((key) => {
        const Icon = DEVICE_ICONS[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={t(key)}
            aria-pressed={value === key}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              value === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
