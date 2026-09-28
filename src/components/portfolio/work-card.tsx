"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink, Maximize2 } from "lucide-react";

import { SourceTypeIcon } from "@/components/portfolio/work-icons";
import { Badge } from "@/components/ui/badge";
import type { PublicWork } from "@/lib/profiles";
import { cn } from "@/lib/utils";

export function WorkCard({ work, onExpand }: { work: PublicWork; onExpand: () => void }) {
  const t = useTranslations("profile");
  const isLive = work.render_mode === "live_iframe" || work.render_mode === "embed";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter") onExpand();
      }}
      className="group relative aspect-4/3 cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      {work.cover_url ? (
        <Image
          src={work.cover_url}
          alt={work.title ?? ""}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <SourceTypeIcon type={work.source_type} className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between bg-black/0 p-3 opacity-0 transition-opacity duration-150",
          "group-hover:bg-black/40 group-hover:opacity-100",
          "[@media(hover:none)]:opacity-100 [@media(hover:none)]:bg-linear-to-t [@media(hover:none)]:from-black/60 [@media(hover:none)]:to-transparent",
        )}
      >
        <div className="flex items-center justify-between">
          <Badge variant={isLive ? "success" : "secondary"} className="bg-white/90 text-black">
            <SourceTypeIcon type={work.source_type} className="mr-1 h-3 w-3" />
            {isLive ? t("live") : t("preview")}
          </Badge>
        </div>

        <div className="flex items-end justify-between gap-2">
          {work.source_url && (
            <a
              href={work.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-black hover:bg-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("visitSite")}
            </a>
          )}
          <span
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black"
            aria-label={t("expand")}
          >
            <Maximize2 className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 opacity-100 group-hover:opacity-0 [@media(hover:none)]:opacity-0">
        <p className="truncate text-sm font-medium text-white">{work.title}</p>
        {work.result && <p className="truncate text-xs text-white/80">{work.result}</p>}
      </div>
    </div>
  );
}
