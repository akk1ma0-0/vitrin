"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORK_CATEGORIES, type WorkCategory } from "@/lib/specializations";
import type { PublicWork } from "@/lib/profiles";

type WorkUpdates = Partial<{ title: string; description: string; result: string; category: WorkCategory }>;

/** Keyed by work.id from the parent, so each work gets its own fresh state
 * on mount instead of syncing props into state via an effect. */
function EditWorkForm({
  work,
  onCancel,
  onSave,
}: {
  work: PublicWork;
  onCancel: () => void;
  onSave: (id: string, updates: WorkUpdates) => Promise<void>;
}) {
  const t = useTranslations("dashboard.works");
  const tCommon = useTranslations("common");
  const tCategory = useTranslations("categories");

  const [title, setTitle] = useState(work.title ?? "");
  const [description, setDescription] = useState(work.description ?? "");
  const [result, setResult] = useState(work.result ?? "");
  const [category, setCategory] = useState<WorkCategory>((work.category as WorkCategory) ?? "other");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(work.id, { title, description, result, category });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("addWork")}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Result</Label>
          <Input value={result} onChange={(e) => setResult(e.target.value)} maxLength={200} placeholder="+40% conversion" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as WorkCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORK_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {tCategory(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {tCommon("save")}
        </Button>
      </DialogFooter>
    </>
  );
}

export function EditWorkDialog({
  work,
  onOpenChange,
  onSave,
}: {
  work: PublicWork | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: WorkUpdates) => Promise<void>;
}) {
  async function handleSave(id: string, updates: WorkUpdates) {
    await onSave(id, updates);
    onOpenChange(false);
  }

  return (
    <Dialog open={Boolean(work)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {work && (
          <EditWorkForm key={work.id} work={work} onCancel={() => onOpenChange(false)} onSave={handleSave} />
        )}
      </DialogContent>
    </Dialog>
  );
}
