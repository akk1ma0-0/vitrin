import { createSupabaseServerClient } from "@/lib/supabase/server";

const FULL_STATS_WINDOW_DAYS = 30;
const TOP_N = 5;

export interface DailyCount {
  date: string;
  count: number;
}

export interface LabeledCount {
  label: string;
  count: number;
}

export interface DeviceCount {
  device: "desktop" | "tablet" | "mobile";
  count: number;
}

export interface FullStats {
  dailyViews: DailyCount[];
  byWork: LabeledCount[];
  sources: LabeledCount[];
  countries: LabeledCount[];
  devices: DeviceCount[];
}

function topN(counts: Map<string, number>, n: number): LabeledCount[] {
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/**
 * Pro-only breakdown (spec section 8's "full statistics" row): a 30-day
 * daily trend, top works by expand count, top referrers, top countries, and
 * a device split. Aggregated in JS from raw event rows rather than a SQL
 * `GROUP BY` RPC — simplest option, and fine at the event volume a
 * freelancer's portfolio page sees.
 */
export async function getFullStats(profileId: string): Promise<FullStats> {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - FULL_STATS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [viewRows, expandRows, worksRows] = await Promise.all([
    supabase
      .from("events")
      .select("created_at, referrer_host, country, device")
      .eq("profile_id", profileId)
      .eq("type", "profile_view")
      .gte("created_at", since.toISOString()),
    supabase
      .from("events")
      .select("work_id")
      .eq("profile_id", profileId)
      .eq("type", "work_expand")
      .not("work_id", "is", null)
      .gte("created_at", since.toISOString()),
    supabase.from("works").select("id, title, slug").eq("profile_id", profileId),
  ]);

  const views = viewRows.data ?? [];
  const expands = expandRows.data ?? [];
  const works = worksRows.data ?? [];
  const titleByWorkId = new Map(works.map((w) => [w.id, w.title ?? w.slug]));

  // Daily trend: every day in the window, oldest first, zero-filled.
  const dailyBuckets = new Map<string, number>();
  for (let i = 0; i < FULL_STATS_WINDOW_DAYS; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    dailyBuckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of views) {
    const day = row.created_at.slice(0, 10);
    if (dailyBuckets.has(day)) dailyBuckets.set(day, (dailyBuckets.get(day) ?? 0) + 1);
  }
  const dailyViews: DailyCount[] = Array.from(dailyBuckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const workCounts = new Map<string, number>();
  for (const row of expands) {
    if (!row.work_id) continue;
    workCounts.set(row.work_id, (workCounts.get(row.work_id) ?? 0) + 1);
  }
  const byWork = Array.from(workCounts.entries())
    .map(([workId, count]) => ({ label: titleByWorkId.get(workId) ?? workId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);

  const sourceCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const deviceCounts = new Map<"desktop" | "tablet" | "mobile", number>([
    ["desktop", 0],
    ["tablet", 0],
    ["mobile", 0],
  ]);
  for (const row of views) {
    const source = row.referrer_host ?? "direct";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    const country = row.country ?? "unknown";
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
    if (row.device) deviceCounts.set(row.device, (deviceCounts.get(row.device) ?? 0) + 1);
  }

  return {
    dailyViews,
    byWork,
    sources: topN(sourceCounts, TOP_N),
    countries: topN(countryCounts, TOP_N),
    devices: Array.from(deviceCounts.entries()).map(([device, count]) => ({ device, count })),
  };
}

export interface OverviewStats {
  views7d: number;
  expands7d: number;
  requests7d: number;
  totalViews: number;
}

export async function getOverviewStats(profileId: string): Promise<OverviewStats> {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [views7d, expands7d, requests7d, totalViews] = await Promise.all([
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("type", "profile_view")
      .gte("created_at", since),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("type", "work_expand")
      .gte("created_at", since),
    supabase
      .from("hire_requests")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .gte("created_at", since),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("type", "profile_view"),
  ]);

  return {
    views7d: views7d.count ?? 0,
    expands7d: expands7d.count ?? 0,
    requests7d: requests7d.count ?? 0,
    totalViews: totalViews.count ?? 0,
  };
}
