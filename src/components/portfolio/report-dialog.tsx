"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Turnstile } from "@/components/turnstile";
import { reportSchema, type ReportInput } from "@/lib/validation/schemas";

const REASONS = ["spam", "nsfw", "scam", "copyright", "offensive", "other"] as const;

export function ReportDialog({
  targetType,
  targetId,
  portalContainer,
}: {
  targetType: "profile" | "work";
  targetId: string;
  portalContainer?: HTMLElement | null;
}) {
  const t = useTranslations("report");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportInput["reason"]>("spam");
  const [details, setDetails] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    const parsed = reportSchema.safeParse({ targetType, targetId, reason, details, turnstileToken });
    if (!parsed.success) return;

    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSubmitted(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <Flag className="h-3 w-3" />
          {t("button")}
        </button>
      </DialogTrigger>
      <DialogContent container={portalContainer} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <p className="py-4 text-center text-sm">{t("success")}</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("reasonLabel")}</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as ReportInput["reason"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`reasons.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("detailsLabel")}</Label>
              <Textarea value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <Turnstile onVerify={setTurnstileToken} />
            <Button onClick={submit} disabled={!turnstileToken}>
              {t("submit")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
