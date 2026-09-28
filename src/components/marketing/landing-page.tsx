import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Layers, MousePointerClick, Rocket, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/i18n/locales";

export async function LandingPage({ locale }: { locale: Locale }) {
  const t = await getTranslations("landing");

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  const features = [
    { icon: MousePointerClick, title: t("featureLiveTitle"), body: t("featureLiveBody") },
    { icon: Rocket, title: t("featureFastTitle"), body: t("featureFastBody") },
    { icon: Sparkles, title: t("featureHireTitle"), body: t("featureHireBody") },
  ];

  return (
    <>
      <section className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-16 pt-20 text-center sm:pt-28">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{t("heroTitle")}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{t("heroSubtitle")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/${locale}/signup`}>
              {t("heroCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={`/${locale}/catalog`}>{t("heroCtaSecondary")}</Link>
          </Button>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">{t("stepsTitle")}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Card key={step.title}>
              <CardContent className="pt-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--accent-foreground)]">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">{t("featuresTitle")}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
                <feature.icon className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center">
        <Layers className="h-8 w-8 text-[var(--accent)]" />
        <h2 className="text-2xl font-semibold sm:text-3xl">{t("ctaTitle")}</h2>
        <p className="max-w-xl text-muted-foreground">{t("ctaBody")}</p>
        <Button asChild size="lg">
          <Link href={`/${locale}/signup`}>{t("ctaButton")}</Link>
        </Button>
      </section>
    </>
  );
}
