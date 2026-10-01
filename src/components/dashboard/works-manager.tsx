"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { WorkRow } from "@/components/dashboard/work-row";
import { EditWorkDialog } from "@/components/dashboard/edit-work-dialog";
import { getPlanLimits, type Plan } from "@/lib/plans";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PublicWork } from "@/lib/profiles";
import type { WorkCategory } from "@/lib/specializations";

type UploadKind = "image" | "video" | "pdf";

const ACCEPT_BY_KIND: Record<UploadKind, string> = {
  image: "image/*",
  video: "video/*",
  pdf: "application/pdf",
};

const UPLOAD_ERROR_KEYS: Record<string, string> = {
  file_too_large: "uploadErrorFileTooLarge",
  storage_quota_exceeded: "uploadErrorQuotaExceeded",
  plan_does_not_allow_video: "uploadErrorPlanKind",
  plan_does_not_allow_pdf: "uploadErrorPlanKind",
  plan_does_not_allow_image: "uploadErrorPlanKind",
};

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function WorksManager({ initialWorks, plan }: { initialWorks: PublicWork[]; plan: Plan }) {
  const t = useTranslations("dashboard.works");
  const [works, setWorks] = useState(initialWorks);
  const [addOpen, setAddOpen] = useState(false);
  const [linksText, setLinksText] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PublicWork | null>(null);
  const [uploadKind, setUploadKind] = useState<UploadKind>("image");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limits = getPlanLimits(plan);
  const limit = limits.maxWorks;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function refreshWorks() {
    const res = await fetch("/api/works");
    if (res.ok) {
      const data = await res.json();
      setWorks(data.works ?? []);
    }
  }

  async function handleAddLinks() {
    const links = linksText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (links.length === 0) return;

    setAdding(true);
    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      if (data.rejected?.length) {
        toast.error(`${data.rejected.length} link(s) couldn't be added`);
      }
      setLinksText("");
      setAddOpen(false);
      await refreshWorks();
    } finally {
      setAdding(false);
    }
  }

  async function handleUpload() {
    const selected = Array.from(fileInputRef.current?.files ?? []);
    if (selected.length === 0) return;

    const oversized = selected.find((f) => f.size > limits.maxUploadFileBytes);
    if (oversized) {
      toast.error(t("uploadErrorFileTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const uploaded: { path: string; mime: string; sizeBytes: number }[] = [];
      for (const file of selected) {
        const path = `${user.id}/${crypto.randomUUID()}.${fileExtension(file.name)}`;
        const { error } = await supabase.storage.from("uploads").upload(path, file, {
          contentType: file.type,
        });
        if (error) {
          toast.error(t("uploadErrorGeneric"));
          return;
        }
        uploaded.push({ path, mime: file.type, sizeBytes: file.size });
      }

      const res = await fetch("/api/works/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: uploadKind, files: uploaded }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(t(UPLOAD_ERROR_KEYS[data.error] ?? "uploadErrorGeneric"));
        return;
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
      setAddOpen(false);
      await refreshWorks();
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleHidden(work: PublicWork) {
    setWorks((prev) => prev.map((w) => (w.id === work.id ? { ...w, is_hidden: !w.is_hidden } : w)));
    await fetch(`/api/works/${work.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden: !work.is_hidden }),
    });
  }

  async function handleDelete(work: PublicWork) {
    setWorks((prev) => prev.filter((w) => w.id !== work.id));
    await fetch(`/api/works/${work.id}`, { method: "DELETE" });
  }

  async function handleSaveEdit(
    id: string,
    updates: Partial<{ title: string; description: string; result: string; category: WorkCategory }>,
  ) {
    setWorks((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    await fetch(`/api/works/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = works.findIndex((w) => w.id === active.id);
    const newIndex = works.findIndex((w) => w.id === over.id);
    const reordered = arrayMove(works, oldIndex, newIndex);
    setWorks(reordered);

    await fetch("/api/works/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((w) => w.id) }),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t("usedOf", { used: works.length, limit })}</span>
          <Button onClick={() => setAddOpen(true)} disabled={works.length >= limit}>
            <Plus className="h-4 w-4" />
            {t("addWork")}
          </Button>
        </div>
      </div>

      {works.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No works yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={works.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {works.map((work) => (
                <WorkRow
                  key={work.id}
                  work={work}
                  onEdit={() => setEditing(work)}
                  onToggleHidden={() => handleToggleHidden(work)}
                  onDelete={() => handleDelete(work)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addWork")}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="link">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">{t("addByLinks")}</TabsTrigger>
              <TabsTrigger value="upload">{t("uploadFile")}</TabsTrigger>
            </TabsList>
            <TabsContent value="link" className="flex flex-col gap-3">
              <Textarea
                rows={6}
                value={linksText}
                onChange={(e) => setLinksText(e.target.value)}
                placeholder="https://..."
              />
              <DialogFooter>
                <Button variant="secondary" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLinks} disabled={adding}>
                  {t("addWork")}
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="upload" className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t("uploadKindLabel")}</Label>
                <Select value={uploadKind} onValueChange={(v) => setUploadKind(v as UploadKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">{t("uploadKindImage")}</SelectItem>
                    <SelectItem value="video" disabled={!limits.allowedUploadKinds.includes("video")}>
                      {t("uploadKindVideo")}
                      {!limits.allowedUploadKinds.includes("video") && ` (${t("proOnly")})`}
                    </SelectItem>
                    <SelectItem value="pdf" disabled={!limits.allowedUploadKinds.includes("pdf")}>
                      {t("uploadKindPdf")}
                      {!limits.allowedUploadKinds.includes("pdf") && ` (${t("proOnly")})`}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("chooseFiles")}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_BY_KIND[uploadKind]}
                  multiple={uploadKind === "image"}
                  className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
                />
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? t("uploading") : t("upload")}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <EditWorkDialog work={editing} onOpenChange={(open) => !open && setEditing(null)} onSave={handleSaveEdit} />
    </div>
  );
}
