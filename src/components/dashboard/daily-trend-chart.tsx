import type { DailyCount } from "@/lib/dashboard";

/**
 * 30-day daily view count as a thin bar sparkline. Single series, single
 * hue (accent) — magnitude only, no categorical identity to encode. Bars
 * anchor to the baseline; a day with zero views renders no bar at all
 * rather than a misleading minimum sliver. The native `title` tooltip is a
 * deliberately minimal hover affordance for a chart this small.
 */
export function DailyTrendChart({ data }: { data: DailyCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex h-28 items-end gap-0.5">
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count}`}
          className="min-w-0 flex-1 rounded-t-sm bg-[var(--accent)]"
          style={{ height: `${(d.count / max) * 100}%` }}
        />
      ))}
    </div>
  );
}
