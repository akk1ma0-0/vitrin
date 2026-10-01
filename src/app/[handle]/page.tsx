import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isLocale } from "@/i18n/locales";
import { CatalogHero } from "@/components/marketing/catalog-hero";
import { CatalogResults } from "@/components/marketing/catalog-results";
import { PublicProfileView } from "@/components/portfolio/public-profile-view";
import { isSignedIn } from "@/lib/auth-redirect";
import { getPublicProfileByUsername, getWorksForProfile, isViewingOwnProfile } from "@/lib/profiles";

export async function generateMetadata({ params }: PageProps<"/[handle]">): Promise<Metadata> {
  const { handle } = await params;

  if (isLocale(handle)) {
    // No explicit title here: the root layout's default ("Vitrin") already
    // applies. Setting one here would run it through the "%s | Vitrin"
    // template too, producing "Vitrin | Vitrin".
    const t = await getTranslations({ locale: handle, namespace: "landing" });
    return { description: t("heroSubtitle") };
  }

  const profile = await getPublicProfileByUsername(handle);
  if (!profile) return {};

  return {
    title: `${profile.display_name ?? profile.username} — ${profile.headline ?? "Vitrin"}`,
    description: profile.bio ?? undefined,
    robots: profile.status === "active" ? undefined : { index: false },
  };
}

export default async function HandlePage({ params, searchParams }: PageProps<"/[handle]">) {
  const { handle } = await params;

  if (isLocale(handle)) {
    // The catalog is the home page: signed-out visitors get a short pitch +
    // "create my page" CTA above it, signed-in visitors (who have an
    // account already and don't need the pitch) get a plain heading. Either
    // way, everyone lands on the same directory — no redirect away from it.
    const sp = await searchParams;
    const [signedIn, t] = await Promise.all([isSignedIn(), getTranslations("catalog")]);

    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        {signedIn ? (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
          </div>
        ) : (
          <CatalogHero locale={handle} />
        )}
        <CatalogResults locale={handle} sp={sp} />
      </div>
    );
  }

  const profile = await getPublicProfileByUsername(handle);
  if (!profile) notFound();

  const [works, isOwner] = await Promise.all([
    getWorksForProfile(profile.id),
    isViewingOwnProfile(profile.id),
  ]);
  const tSpec = await getTranslations("specializations");
  const specializationLabel =
    profile.specialization && tSpec.has(profile.specialization)
      ? tSpec(profile.specialization)
      : profile.specialization;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.display_name,
      description: profile.headline ?? undefined,
      image: profile.avatar_url ?? undefined,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/${profile.username}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicProfileView
        profile={profile}
        works={works}
        specializationLabel={specializationLabel}
        initialOpenWorkId={null}
        isOwner={isOwner}
      />
    </>
  );
}
