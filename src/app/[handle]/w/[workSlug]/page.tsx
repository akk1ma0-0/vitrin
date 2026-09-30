import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isLocale } from "@/i18n/locales";
import { PublicProfileView } from "@/components/portfolio/public-profile-view";
import { getPublicProfileByUsername, getWorksForProfile, isViewingOwnProfile } from "@/lib/profiles";

export default async function WorkDeepLinkPage({
  params,
}: PageProps<"/[handle]/w/[workSlug]">) {
  const { handle, workSlug } = await params;

  // Locale codes never own works — this route only makes sense for a username handle.
  if (isLocale(handle)) notFound();

  const profile = await getPublicProfileByUsername(handle);
  if (!profile) notFound();

  const [works, isOwner] = await Promise.all([
    getWorksForProfile(profile.id),
    isViewingOwnProfile(profile.id),
  ]);
  const work = works.find((w) => w.slug === workSlug);
  if (!work) notFound();

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
      initialOpenWorkId={work.id}
      isOwner={isOwner}
    />
  );
}
