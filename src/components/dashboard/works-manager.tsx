"use client";

import { useState } from "react";
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
import type { PublicWork } from "@/lib/profiles";
import type { WorkCategory } from "@/lib/specializations";

export function WorksManager({ initialWorks, plan }: { initialWorks: PublicWork[]; plan: Plan }) {
  const t = useTranslations("dashboard.works");
  const [works, setWorks] = useState(initialWorks);
  const [addOpen, setAddOpen] = useState(false);
  const [linksText, setLinksText] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PublicWork | null>(null);

  const limit = getPlanLimits(plan).maxWorks;
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
            <DialogTitle>{t("addByLinks")}</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      <EditWorkDialog work={editing} onOpenChange={(open) => !open && setEditing(null)} onSave={handleSaveEdit} />
    </div>
  );
}
