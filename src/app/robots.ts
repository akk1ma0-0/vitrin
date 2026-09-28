import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitrin.work";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/onboarding", "/admin", "/api"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
