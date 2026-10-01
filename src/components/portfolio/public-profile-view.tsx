"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { ProfileHeader } from "@/components/portfolio/profile-header";
import { WorkGrid } from "@/components/portfolio/work-grid";
import { WorkViewer } from "@/components/portfolio/work-viewer";
import { HireForm } from "@/components/portfolio/hire-form";
import { ReportDialog } from "@/components/portfolio/report-dialog";
import { Logo } from "@/components/logo";
import { CookieLocaleSwitcher } from "@/components/cookie-locale-switcher";
import { Button } from "@/components/ui/button";
import type { PublicProfile, PublicWork } from "@/lib/profiles";

function subscribeToColorScheme(callback: () => void): () => void {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getPrefersDarkSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Resolves "system" the way the *viewer's own device* currently sees it — the only "system" available at render time. */
function useSystemPrefersDark(): boolean {
  return useSyncExternalStore(subscribeToColorScheme, getPrefersDarkSnapshot, () => false);
}

export function PublicProfileView({
  profile,
  works,
  specializationLabel,
  initialOpenWorkId,
  isOwner,
}: {
  profile: PublicProfile;
  works: PublicWork[];
  specializationLabel: string | null;
  initialOpenWorkId: string | null;
  isOwner: boolean;
}) {
  const t = useTranslations("footer");
  const tProfile = useTranslations("profile");
  const router = useRouter();
  const [openWorkId, setOpenWorkId] = useState<string | null>(initialOpenWorkId);
  const [hireForWork, setHireForWork] = useState<PublicWork | undefined>(undefined);
  const [hireOpen, setHireOpen] = useState(false);
  // Dialogs portal into this node instead of document.body, so they pick up
  // the owner/visitor theme set below instead of the page-wide one on <html>.
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  // Spec section 3: a visitor sees the theme the *owner* picked, not their
  // own — with an opt-out back to their own site-wide theme.
  const [useOwnerTheme, setUseOwnerTheme] = useState(true);
  const { resolvedTheme: visitorTheme } = useTheme();
  const systemPrefersDark = useSystemPrefersDark();
  const ownerResolvedTheme: "light" | "dark" =
    profile.theme === "system" ? (systemPrefersDark ? "dark" : "light") : profile.theme;
  const visitorResolvedTheme: "light" | "dark" = visitorTheme === "dark" ? "dark" : "light";
  const pageTheme = useOwnerTheme ? ownerResolvedTheme : visitorResolvedTheme;

  useEffect(() => {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "profile_view", profileId: profile.id }),
      keepalive: true,
    }).catch(() => {});
  }, [profile.id]);

  function openWork(workId: string) {
    const work = works.find((w) => w.id === workId);
    setOpenWorkId(workId);
    if (work?.slug) {
      router.push(`/${profile.username}/w/${work.slug}`, { scroll: false });
    }
  }

  function closeViewer() {
    setOpenWorkId(null);
    router.push(`/${profile.username}`, { scroll: false });
  }

  function openHireForm(work?: PublicWork) {
    setHireForWork(work);
    setHireOpen(true);
  }

  return (
    <div
      ref={setPortalContainer}
      data-theme={pageTheme}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setUseOwnerTheme((v) => !v)}>
            {useOwnerTheme ? tProfile("useMyTheme") : tProfile("useOwnerTheme")}
          </Button>
          <CookieLocaleSwitcher />
        </div>
      </div>
      {isOwner && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2 text-sm">
          <span className="truncate text-muted-foreground">{tProfile("ownerBar")}</span>
          <Link
            href="/dashboard"
            className="shrink-0 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            {tProfile("goToDashboard")}
          </Link>
        </div>
      )}
      <div className="flex-1">
        <ProfileHeader
          profile={profile}
          specializationLabel={specializationLabel}
          onHireClick={() => openHireForm(undefined)}
        />
        <WorkGrid works={works} onExpand={openWork} />
      </div>

      <WorkViewer
        works={works}
        openWorkId={openWorkId}
        onClose={closeViewer}
        onNavigate={openWork}
        onHireClick={(work) => openHireForm(work)}
        portalContainer={portalContainer}
      />

      <HireForm
        open={hireOpen}
        onOpenChange={setHireOpen}
        profileId={profile.id}
        workId={hireForWork?.id}
        portalContainer={portalContainer}
      />

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 text-center text-xs text-muted-foreground">
          <Link
            href="/"
            className="group inline-flex flex-col items-center gap-0.5 rounded-xl border border-border px-4 py-2 transition-colors hover:border-foreground/30 hover:bg-surface"
          >
            <span className="inline-flex items-center gap-1 text-foreground">
              {t("madeWith")} <Logo className="text-xs" />
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground">
              {t("createYours")}
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
          <ReportDialog targetType="profile" targetId={profile.id} portalContainer={portalContainer} />
        </div>
      </footer>
    </div>
  );
}
