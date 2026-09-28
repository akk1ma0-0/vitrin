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
    const t = await getTranslations({ locale: handle, namespace: "landing" });
    return { title: "Vitrin", description: t("heroSubtitle") };
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

  return (
    <PublicProfileView
      profile={profile}
      works={works}
      specializationLabel={specializationLabel}
      initialOpenWorkId={null}
    />
  );
}
