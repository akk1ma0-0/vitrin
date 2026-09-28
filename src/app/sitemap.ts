import type { MetadataRoute } from "next";

import { LOCALES } from "@/i18n/locales";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MARKETING_ROUTES = ["", "/pricing", "/catalog", "/terms", "/privacy", "/refund", "/login", "/signup"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitrin.work";

  const marketingEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    MARKETING_ROUTES.map((route) => ({
      url: `${siteUrl}/${locale}${route}`,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.6,
    })),
  );

  let profileEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data: profiles } = await supabase
      .from("catalog_profiles")
      .select("username, updated_at")
      .not("username", "is", null);

    profileEntries = (profiles ?? []).map((p) => ({
      url: `${siteUrl}/${p.username}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Supabase not configured yet in this environment — sitemap still returns the marketing routes.
  }

  return [...marketingEntries, ...profileEntries];
}
