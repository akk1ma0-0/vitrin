"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders `children` at a fixed device width, then scales the whole thing
 * down with a CSS transform to fit the available container width — so an
 * embedded site renders exactly as it would on that device (spec 5.5).
 */
export function ScaledFrame({
  deviceWidth,
  height,
  children,
}: {
  deviceWidth: number;
  height: number;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const containerWidth = entry.contentRect.width;
      setScale(Math.min(1, containerWidth / deviceWidth));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [deviceWidth]);

  return (
    <div ref={containerRef} className="flex w-full justify-center overflow-hidden" style={{ height: height * scale }}>
      <div
        style={{
          width: deviceWidth,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
