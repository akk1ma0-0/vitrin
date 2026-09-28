import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { assertLocaleHandle } from "@/lib/handle";
import { PLAN_LIMITS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PricingPage({ params }: PageProps<"/[handle]/pricing">) {
  const { handle } = await params;
  assertLocaleHandle(handle);
  const t = await getTranslations("pricing");
  const tCommon = await getTranslations("common");

  const freeFeatures = [
    t("featureWorks", { count: PLAN_LIMITS.free.maxWorks }),
    t("featureStorage", { amount: "100 MB" }),
    t("featureBranding"),
    t("featureAnalytics"),
  ];

  const proFeatures = [
    t("featureWorksUnlimited"),
    t("featureStorage", { amount: "5 GB" }),
    t("featureNoBranding"),
    t("featureFullAnalytics"),
    t("featureAccent"),
    t("featureCatalogBoost"),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-center text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-center text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("freeTitle")}</CardTitle>
            <p className="text-3xl font-semibold">€0</p>
            <p className="text-sm text-muted-foreground">{t("freeBody")}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2 text-sm">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-muted-foreground" /> {f}
                </li>
              ))}
            </ul>
            <Button asChild variant="secondary">
              <a href={`/${handle}/signup`}>{t("cta")}</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[var(--accent)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{t("proTitle")}</CardTitle>
              <Badge>Pro</Badge>
            </div>
            <p className="text-3xl font-semibold">
              €8<span className="text-base font-normal text-muted-foreground">{t("perMonth")}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              €72{t("perYear")} — {t("proBody")}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2 text-sm">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[var(--accent)]" /> {f}
                </li>
              ))}
            </ul>
            <Button disabled>{tCommon("comingSoon")}</Button>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">{t("taxNotice")}</p>
    </div>
  );
}
