"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicProfile } from "@/lib/profiles";
import { ContactButtons } from "@/components/portfolio/contact-buttons";

export function ProfileHeader({
  profile,
  specializationLabel,
  onHireClick,
}: {
  profile: PublicProfile;
  specializationLabel: string | null;
  onHireClick: () => void;
}) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [bioExpanded, setBioExpanded] = useState(false);

  const initials = (profile.display_name ?? profile.username ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ url, title: profile.display_name ?? profile.username ?? "" });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <header className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 pb-8 pt-12 text-center">
      <Avatar className="h-24 w-24">
        <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name ?? ""} />
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <h1 className="text-2xl font-semibold">{profile.display_name}</h1>
        {profile.plan === "pro" && <Badge variant="secondary">Pro</Badge>}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        {profile.headline && <span>{profile.headline}</span>}
        {specializationLabel && <span>&middot; {specializationLabel}</span>}
        {profile.available_for_work && (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t("openToWork")}
          </span>
        )}
      </div>

      {profile.bio && (
        <div className="max-w-xl">
          <p className={bioExpanded ? "text-sm text-muted-foreground" : "line-clamp-3 text-sm text-muted-foreground"}>
            {profile.bio}
          </p>
          <button
            type="button"
            onClick={() => setBioExpanded((v) => !v)}
            className="mt-1 text-xs font-medium text-[var(--accent)] hover:underline"
          >
            {bioExpanded ? t("bioShowLess") : t("bioShowMore")}
          </button>
        </div>
      )}

      {profile.skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {profile.skills.map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onHireClick} size="lg">
          {t("hireMe")}
        </Button>
        <ContactButtons contacts={profile.contacts} />
        <Button variant="ghost" size="icon" onClick={handleShare} aria-label={tCommon("share")}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
