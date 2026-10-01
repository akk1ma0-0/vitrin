import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PublicProfile } from "@/lib/profiles";

function formatRate(profile: PublicProfile, unitLabel: string | null): string | null {
  if (profile.rate_min == null && profile.rate_max == null) return null;
  const range =
    profile.rate_min != null && profile.rate_max != null
      ? `${profile.rate_min}–${profile.rate_max}`
      : String(profile.rate_min ?? profile.rate_max);
  return unitLabel ? `${range} ${profile.rate_currency} ${unitLabel}` : `${range} ${profile.rate_currency}`;
}

export function CatalogCard({
  profile,
  specializationLabel,
  covers,
}: {
  profile: PublicProfile;
  specializationLabel: string | null;
  covers: string[];
}) {
  const t = useTranslations("catalog");

  const initials = (profile.display_name ?? profile.username ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const unitLabel = profile.rate_unit ? t(`rateUnit.${profile.rate_unit}`) : null;
  const rate = formatRate(profile, unitLabel);

  return (
    <Link
      href={`/${profile.username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-foreground/30 hover:bg-surface"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name ?? ""} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{profile.display_name}</p>
            {profile.plan === "pro" && <Badge variant="secondary">Pro</Badge>}
          </div>
          {profile.headline && <p className="truncate text-sm text-muted-foreground">{profile.headline}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {specializationLabel && <Badge variant="outline">{specializationLabel}</Badge>}
        {profile.available_for_work && (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t("openToWork")}
          </span>
        )}
        {rate && <span>{rate}</span>}
      </div>

      {covers.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {covers.map((url, i) => (
            <div key={i} className="relative aspect-4/3 overflow-hidden rounded-lg bg-surface">
              <Image src={url} alt="" fill sizes="120px" className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
