import { getTranslations } from "next-intl/server";

import { assertLocaleHandle } from "@/lib/handle";

// Full catalog (search, filters, SEO specialization pages) ships in stage 2 (spec section 5.8).
export default async function CatalogPage({ params }: PageProps<"/[handle]/catalog">) {
  const { handle } = await params;
  assertLocaleHandle(handle);
  const t = await getTranslations("common");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t("comingSoon")}</h1>
      <p className="mt-2 text-muted-foreground">
        The freelancer catalog with search and filters ships in the next stage.
      </p>
    </div>
  );
}
