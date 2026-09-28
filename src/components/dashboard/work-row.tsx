"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, GripVertical, Loader2, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourceTypeIcon } from "@/components/portfolio/work-icons";
import type { PublicWork } from "@/lib/profiles";

export function WorkRow({
  work,
  onEdit,
  onToggleHidden,
  onDelete,
}: {
  work: PublicWork;
  onEdit: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("dashboard.works");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: work.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground touch-none">
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
        {work.cover_url ? (
          <Image src={work.cover_url} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center">
            <SourceTypeIcon type={work.source_type} className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{work.title ?? work.source_url}</p>
        <div className="mt-1 flex items-center gap-2">
          {work.ingest_status !== "ready" && (
            <Badge variant={work.ingest_status === "failed" ? "warning" : "secondary"} className="gap-1">
              {work.ingest_status === "processing" || work.ingest_status === "pending" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
              {t(`status${work.ingest_status[0].toUpperCase()}${work.ingest_status.slice(1)}` as never)}
            </Badge>
          )}
          {work.moderation_status === "flagged" && <Badge variant="warning">Flagged</Badge>}
          {work.is_hidden && <Badge variant="secondary">{t("hide")}</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label={t("addWork")}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleHidden} aria-label={t("hide")}>
          {work.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
