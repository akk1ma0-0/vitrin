import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/locales";

/** Shown above the catalog for signed-out visitors only — a signed-in user has no use for a "create my page" pitch. */
export async function CatalogHero({ locale }: { locale: Locale }) {
  const t = await getTranslations("landing");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pb-10 pt-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("heroTitle")}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">{t("heroSubtitle")}</p>
      <Button asChild size="lg" className="mt-5">
        <Link href={`/${locale}/signup`}>
          {t("heroCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
