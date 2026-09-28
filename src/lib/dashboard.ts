import { createSupabaseServerClient } from "@/lib/supabase/server";

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
