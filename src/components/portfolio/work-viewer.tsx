"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ExternalLink, Share2, X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeviceSwitcher, type DeviceKey } from "@/components/portfolio/device-switcher";
import { SourceTypeIcon } from "@/components/portfolio/work-icons";
import { LiveIframe } from "@/components/viewer-adapters/live-iframe";
import { ScreenshotScroller } from "@/components/viewer-adapters/screenshot-scroller";
import { EmbedFrame } from "@/components/viewer-adapters/embed-frame";
import { GithubCard } from "@/components/viewer-adapters/github-card";
import { ImageGallery } from "@/components/viewer-adapters/image-gallery";
import { PdfViewer } from "@/components/viewer-adapters/pdf-viewer";
import type { PublicWork } from "@/lib/profiles";

export function WorkViewer({
  works,
  openWorkId,
  onClose,
  onNavigate,
  onHireClick,
}: {
  works: PublicWork[];
  openWorkId: string | null;
  onClose: () => void;
  onNavigate: (workId: string) => void;
  onHireClick: (work: PublicWork) => void;
}) {
  const t = useTranslations("viewer");
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [forceScreenshot, setForceScreenshot] = useState(false);

  const index = works.findIndex((w) => w.id === openWorkId);
  const work = index >= 0 ? works[index] : null;

  useEffect(() => {
    if (!work) return;
    // Reset the manual screenshot fallback whenever the viewer switches to a
    // different work, so a previous work's load failure doesn't carry over.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForceScreenshot(false);
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "work_expand", profileId: work.profile_id, workId: work.id }),
      keepalive: true,
    }).catch(() => {});
  }, [work]);

  const canSwitchDevice = work?.render_mode === "live_iframe" || work?.render_mode === "screenshot";

  const content = useMemo(() => {
    if (!work) return null;

    if (work.render_mode === "live_iframe" && !forceScreenshot) {
      return (
        <LiveIframe
          url={work.embed_url ?? work.source_url ?? ""}
          device={device}
          onFallbackToScreenshot={() => setForceScreenshot(true)}
        />
      );
    }
    if (work.render_mode === "screenshot" || forceScreenshot) {
      return work.screenshot_url ? (
        <ScreenshotScroller url={work.screenshot_url} device={device} />
      ) : null;
    }
    if (work.render_mode === "video" || work.render_mode === "embed") {
      return work.embed_url ? (
        <EmbedFrame url={work.embed_url} title={work.title ?? "embed"} />
      ) : null;
    }
    if (work.render_mode === "github_card") {
      return <GithubCard sourceUrl={work.source_url ?? "#"} meta={work.meta} />;
    }
    if (work.render_mode === "gallery") {
      return <ImageGallery images={work.cover_url ? [work.cover_url] : []} alt={work.title ?? ""} />;
    }
    if (work.render_mode === "pdf") {
      return work.source_url ? <PdfViewer url={work.source_url} /> : null;
    }
    return null;
  }, [work, device, forceScreenshot]);

  if (!work) return null;

  return (
    <Dialog open={Boolean(work)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideClose
        className="flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:h-[calc(100vh-3rem)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <SourceTypeIcon type={work.source_type} className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h2 className="truncate font-medium">{work.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {canSwitchDevice && <DeviceSwitcher value={device} onChange={setDevice} />}
            {work.source_url && (
              <Button variant="ghost" size="icon" asChild>
                <a href={work.source_url} target="_blank" rel="noopener noreferrer" aria-label={t("openOriginal")}>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="relative flex flex-1 items-start justify-center overflow-y-auto bg-surface p-4">
            {works.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="fixed left-4 top-1/2 z-10 -translate-y-1/2"
                  onClick={() => onNavigate(works[(index - 1 + works.length) % works.length].id)}
                  aria-label={t("previous")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="fixed right-4 top-1/2 z-10 -translate-y-1/2"
                  onClick={() => onNavigate(works[(index + 1) % works.length].id)}
                  aria-label={t("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <div className="w-full">{content}</div>
          </div>

          <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border p-4 md:flex">
            {work.description && <p className="text-sm text-muted-foreground">{work.description}</p>}
            {work.result && (
              <p className="rounded-lg bg-surface px-3 py-2 text-sm font-medium">{work.result}</p>
            )}
            {work.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {work.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <Button onClick={() => onHireClick(work)} className="mt-auto">
              {t("similarProjectCta")}
            </Button>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
