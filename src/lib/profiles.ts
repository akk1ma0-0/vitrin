import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type PublicProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type PublicWork = Database["public"]["Tables"]["works"]["Row"];

/**
 * Looks up a profile by username for the public portfolio page. Returns
 * null both when the username doesn't exist and when Supabase isn't
 * configured yet, so pages can fall back to `notFound()` either way.
 */
export async function getPublicProfileByUsername(username: string): Promise<PublicProfile | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username.toLowerCase())
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/** Whether the currently signed-in user (if any) owns this profile — used to show the "edit my page" bar on the public view. */
export async function isViewingOwnProfile(profileId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id === profileId;
  } catch {
    return false;
  }
}

export async function getWorksForProfile(profileId: string): Promise<PublicWork[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("works")
      .select("*")
      .eq("profile_id", profileId)
      .order("position", { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export const CATALOG_PAGE_SIZE = 24;

export interface CatalogQuery {
  q?: string;
  specialization?: string;
  availableOnly?: boolean;
  sort?: "relevance" | "newest";
  page?: number;
}

export interface CatalogResult {
  profiles: PublicProfile[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * The `catalog_profiles` view (0003_works.sql) already applies the spec
 * 8.2 visibility gate (active, email verified, avatar + headline set, >=3
 * ready works) — this just adds search/filter/sort/pagination on top of it.
 * Text search is plain ILIKE on username/display_name/headline, not the
 * full-text + pg_trgm search the spec describes for stage 2; good enough
 * for a usable v1 without a dedicated search index migration.
 */
export async function getCatalogProfiles(query: CatalogQuery): Promise<CatalogResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = CATALOG_PAGE_SIZE;

  try {
    const supabase = await createSupabaseServerClient();
    let builder = supabase.from("catalog_profiles").select("*", { count: "exact" });

    const q = query.q?.trim();
    if (q) {
      // Strip characters that have special meaning inside a PostgREST `.or()`
      // filter string (`,()%`) so user input can't alter which fields/ops
      // get matched — this is filter-syntax safety, not SQL injection (the
      // underlying query is still parameterized), but worth guarding anyway.
      const safe = q.replace(/[,()%]/g, " ").trim();
      if (safe) {
        builder = builder.or(
          `username.ilike.%${safe}%,display_name.ilike.%${safe}%,headline.ilike.%${safe}%`,
        );
      }
    }

    if (query.specialization) {
      builder = builder.eq("specialization", query.specialization);
    }

    if (query.availableOnly) {
      builder = builder.eq("available_for_work", true);
    }

    // "relevance": Pro profiles first (spec 5.8), then newest within each
    // group. Plain string sort works here because there are only two plan
    // values and "pro" > "free" lexically.
    if (query.sort === "newest") {
      builder = builder.order("created_at", { ascending: false });
    } else {
      builder = builder
        .order("plan", { ascending: false })
        .order("created_at", { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const { data, error, count } = await builder.range(from, from + pageSize - 1);

    if (error || !data) return { profiles: [], total: 0, page, pageSize };
    return { profiles: data, total: count ?? data.length, page, pageSize };
  } catch {
    return { profiles: [], total: 0, page, pageSize };
  }
}

/** Up to 3 presentable covers per profile, for the catalog card grid. */
export async function getCatalogCovers(profileIds: string[]): Promise<Record<string, string[]>> {
  if (profileIds.length === 0) return {};

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("works")
      .select("profile_id, cover_url, position")
      .in("profile_id", profileIds)
      .eq("is_hidden", false)
      .eq("safety_status", "safe")
      .neq("moderation_status", "rejected")
      .not("cover_url", "is", null)
      .order("position", { ascending: true });

    if (error || !data) return {};

    const covers: Record<string, string[]> = {};
    for (const work of data) {
      const list = covers[work.profile_id] ?? (covers[work.profile_id] = []);
      if (list.length < 3 && work.cover_url) list.push(work.cover_url);
    }
    return covers;
  } catch {
    return {};
  }
}
