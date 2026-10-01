import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { assertLocaleHandle } from "@/lib/handle";
import { CatalogResults } from "@/components/marketing/catalog-results";
import { isValidSpecialization } from "@/lib/specializations";

export async function generateMetadata({
  params,
}: PageProps<"/[handle]/catalog/[specialization]">): Promise<Metadata> {
  const { handle, specialization } = await params;
  if (!isValidSpecialization(specialization)) return {};

  const [tSpec, tCatalog] = await Promise.all([
    getTranslations({ locale: handle, namespace: "specializations" }),
    getTranslations({ locale: handle, namespace: "catalog" }),
  ]);
  const label = tSpec(specialization);

  return {
    title: label,
    description: tCatalog("specializationDescription", { specialization: label }),
  };
}

export default async function CatalogSpecializationPage({
  params,
  searchParams,
}: PageProps<"/[handle]/catalog/[specialization]">) {
  const { handle, specialization } = await params;
  const locale = assertLocaleHandle(handle);
  if (!isValidSpecialization(specialization)) notFound();

  const sp = await searchParams;
  // The path segment is the source of truth for this page; a `specialization`
  // query param (e.g. from a shared link) can't override it.
  const mergedSp = { ...sp, specialization };

  const [tSpec, tCatalog] = await Promise.all([
    getTranslations("specializations"),
    getTranslations("catalog"),
  ]);
  const label = tSpec(specialization);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">{tCatalog("specializationTitle", { specialization: label })}</h1>
        <p className="mt-2 text-muted-foreground">{tCatalog("subtitle")}</p>
      </div>
      <CatalogResults locale={locale} sp={mergedSp} />
    </div>
  );
}
