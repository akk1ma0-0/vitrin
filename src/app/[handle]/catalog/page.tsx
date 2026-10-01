import { redirect } from "next/navigation";

import { assertLocaleHandle } from "@/lib/handle";

/**
 * The catalog is now the home page (`/{locale}`) instead of its own route —
 * this keeps old `/catalog` links/bookmarks working by forwarding them
 * (with their query string) to the new location, rather than 404ing or
 * duplicating the directory at two URLs.
 */
export default async function CatalogRedirectPage({
  params,
  searchParams,
}: PageProps<"/[handle]/catalog">) {
  const { handle } = await params;
  const locale = assertLocaleHandle(handle);
  const sp = await searchParams;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") qs.set(key, value);
  }

  const query = qs.toString();
  redirect(`/${locale}${query ? `?${query}` : ""}`);
}
