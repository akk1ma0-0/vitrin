import type { ReactNode } from "react";

export interface RankedBarItem {
  key: string;
  label: ReactNode;
  count: number;
}

/**
 * A labeled, magnitude-ranked list (top sources / countries / works /
 * devices): category identity comes from the text label, not color, so
 * every bar is the same accent hue — this isn't a categorical chart, it's a
 * value indicator next to a name, like a ranked table.
 */
export function RankedBarList({ items, emptyLabel }: { items: RankedBarItem[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-muted-foreground">{item.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-medium">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
