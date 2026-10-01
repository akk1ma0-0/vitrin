"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Turnstile } from "@/components/turnstile";
import { hireRequestSchema, type HireRequestInput } from "@/lib/validation/schemas";

export function HireForm({
  open,
  onOpenChange,
  profileId,
  workId,
  portalContainer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  workId?: string;
  portalContainer?: HTMLElement | null;
}) {
  const t = useTranslations("hireForm");
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HireRequestInput>({
    resolver: zodResolver(hireRequestSchema),
    defaultValues: { profileId, workId: workId ?? null, locale, website: "" },
  });

  async function onSubmit(values: HireRequestInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, turnstileToken }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
    } catch {
      toast.error(t("subtitle"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setSubmitted(false);
          reset();
        }
      }}
    >
      <DialogContent container={portalContainer} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="py-6 text-center text-sm font-medium">{t("success")}</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <input type="hidden" {...register("website")} tabIndex={-1} autoComplete="off" />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{t("nameLabel")}</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget">{t("budgetLabel")}</Label>
              <Input id="budget" {...register("budget")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="message">{t("messageLabel")}</Label>
              <Textarea id="message" placeholder={t("messagePlaceholder")} {...register("message")} />
              {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
            </div>

            <Turnstile onVerify={setTurnstileToken} />

            <Button type="submit" disabled={submitting || !turnstileToken}>
              {t("submit")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
