import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isLocale } from "@/i18n/locales";
import { LandingPage } from "@/components/marketing/landing-page";
import { PublicProfileView } from "@/components/portfolio/public-profile-view";
import { getPublicProfileByUsername, getWorksForProfile } from "@/lib/profiles";

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

export default async function HandlePage({ params }: PageProps<"/[handle]">) {
  const { handle } = await params;

  if (isLocale(handle)) {
    return <LandingPage locale={handle} />;
  }

  const profile = await getPublicProfileByUsername(handle);
  if (!profile) notFound();

  const works = await getWorksForProfile(profile.id);
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
      />
    </>
  );
}
