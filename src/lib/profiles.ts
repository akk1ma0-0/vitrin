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
