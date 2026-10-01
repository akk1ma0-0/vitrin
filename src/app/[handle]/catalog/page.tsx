import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { assertLocaleHandle } from "@/lib/handle";
import { CatalogCard } from "@/components/marketing/catalog-card";
import { CatalogFilters } from "@/components/marketing/catalog-filters";
import { Button } from "@/components/ui/button";
import {
  CATALOG_PAGE_SIZE,
  getCatalogCovers,
  getCatalogProfiles,
  type CatalogQuery,
} from "@/lib/profiles";
import { isValidSpecialization } from "@/lib/specializations";

export default async function CatalogPage({
  params,
  searchParams,
}: PageProps<"/[handle]/catalog">) {
  const { handle } = await params;
  const locale = assertLocaleHandle(handle);
  const sp = await searchParams;

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const specializationParam = typeof sp.specialization === "string" ? sp.specialization : undefined;
  const specialization =
    specializationParam && isValidSpecialization(specializationParam) ? specializationParam : undefined;
  const availableOnly = sp.available === "1";
  const sort = sp.sort === "newest" ? "newest" : "relevance";
  const page = Math.max(1, Number(sp.page) || 1);

  const query: CatalogQuery = { q, specialization, availableOnly, sort, page };

  const [t, tSpec, { profiles, total }] = await Promise.all([
    getTranslations("catalog"),
    getTranslations("specializations"),
    getCatalogProfiles(query),
  ]);

  const covers = await getCatalogCovers(profiles.map((p) => p.id));
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

  function pageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (specialization) next.set("specialization", specialization);
    if (availableOnly) next.set("available", "1");
    if (sort !== "relevance") next.set("sort", sort);
    if (targetPage > 1) next.set("page", String(targetPage));
    const qs = next.toString();
    return `/${locale}/catalog${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-6">
        <CatalogFilters basePath={`/${locale}/catalog`} />
      </div>

      {profiles.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{t("resultsCount", { count: total })}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <CatalogCard
                key={profile.id}
                profile={profile}
                specializationLabel={
                  profile.specialization && tSpec.has(profile.specialization)
                    ? tSpec(profile.specialization)
                    : profile.specialization
                }
                covers={covers[profile.id] ?? []}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {page > 1 ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={pageHref(page - 1)}>{t("previous")}</Link>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" disabled>
                  {t("previous")}
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {t("page", { page, total: totalPages })}
              </span>
              {page < totalPages ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={pageHref(page + 1)}>{t("next")}</Link>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" disabled>
                  {t("next")}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
