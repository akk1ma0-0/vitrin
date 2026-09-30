"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

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
import { SPECIALIZATIONS, type Specialization } from "@/lib/specializations";

type Step = "username" | "profile" | "links" | "contacts" | "done";
const STEPS: Step[] = ["username", "profile", "links", "contacts", "done"];

interface WorkStatus {
  id: string;
  title: string | null;
  ingest_status: "pending" | "processing" | "ready" | "failed";
  source_url: string | null;
}

export function OnboardingWizard({ initialEmail }: { initialEmail: string }) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tSpec = useTranslations("specializations");
  const router = useRouter();
  const [step, setStep] = useState<Step>("username");
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">(
    "idle",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [specialization, setSpecialization] = useState<Specialization>("other");
  const [headline, setHeadline] = useState("");

  const [linksText, setLinksText] = useState("");
  const [works, setWorks] = useState<WorkStatus[]>([]);

  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Debounced availability check: these are synchronous UI-state resets
    // for the *current* keystroke, the actual async check runs in the timeout below.
    if (!username) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/username-available?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : data.error ? "invalid" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  // Poll ingest status while on the links step.
  useEffect(() => {
    if (step !== "links" || works.length === 0) return;
    if (works.every((w) => w.ingest_status === "ready" || w.ingest_status === "failed")) return;

    const interval = setInterval(async () => {
      const res = await fetch("/api/works");
      if (!res.ok) return;
      const data = await res.json();
      setWorks(data.works ?? []);
    }, 2000);
    return () => clearInterval(interval);
  }, [step, works]);

  async function handleProfileSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, specialization, headline }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail ?? data.error ?? "Something went wrong");
        return;
      }
      setStep("links");
    } finally {
      setSaving(false);
    }
  }

  async function handleLinksSubmit() {
    setSaving(true);
    try {
      const links = linksText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 10);

      if (links.length > 0) {
        const res = await fetch("/api/works", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ links }),
        });
        const data = await res.json();
        if (res.ok) {
          const worksRes = await fetch("/api/works");
          const worksData = await worksRes.json();
          setWorks(worksData.works ?? []);
        } else {
          toast.error(data.error ?? "Something went wrong");
        }
      }
      setStep("contacts");
    } finally {
      setSaving(false);
    }
  }

  async function handleContactsSubmit() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: { email: contactEmail || undefined, telegram: telegram || undefined, whatsapp: whatsapp || undefined },
        }),
      });
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      setStep("done");
    } finally {
      setSaving(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-12">
      {step !== "done" && (
        <div className="mb-8 flex gap-1.5">
          {STEPS.slice(0, -1).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-[var(--accent)]" : "bg-surface-hover"}`}
            />
          ))}
        </div>
      )}

      {step === "username" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">{t("step1Title")}</h1>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">{t("usernamePreview", { username: username || "you" })}</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {usernameStatus === "available" && <Check className="h-4 w-4 text-emerald-500" />}
                {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            {usernameStatus === "available" && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("usernameAvailable")}</p>
            )}
            {usernameStatus === "taken" && <p className="text-xs text-red-500">{t("usernameTaken")}</p>}
          </div>
          <Button onClick={() => setStep("profile")} disabled={usernameStatus !== "available"}>
            {tCommon("continue")}
          </Button>
        </div>
      )}

      {step === "profile" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">{t("step2Title")}</h1>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">{t("displayNameLabel")}</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("specializationLabel")}</Label>
            <Select value={specialization} onValueChange={(v) => setSpecialization(v as Specialization)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPECIALIZATIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {tSpec(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="headline">{t("headlineLabel")}</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={t("headlinePlaceholder")}
            />
          </div>
          <Button onClick={handleProfileSubmit} disabled={saving || !displayName}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {tCommon("continue")}
          </Button>
        </div>
      )}

      {step === "links" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">{t("step3Title")}</h1>
          <p className="text-sm text-muted-foreground">{t("linksInstructions")}</p>
          <Textarea
            rows={6}
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
            placeholder={t("linksPlaceholder")}
          />

          {works.length > 0 && (
            <ul className="flex flex-col gap-2">
              {works.map((w) => (
                <li key={w.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm">
                  <span className="truncate">{w.title ?? w.source_url}</span>
                  {w.ingest_status === "ready" ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : w.ingest_status === "failed" ? (
                    <X className="h-4 w-4 shrink-0 text-red-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                  )}
                </li>
              ))}
            </ul>
          )}

          <Button onClick={handleLinksSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {tCommon("continue")}
          </Button>
          <button onClick={() => setStep("contacts")} className="text-sm text-muted-foreground hover:underline">
            {t("skip")}
          </button>
        </div>
      )}

      {step === "contacts" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">{t("step4Title")}</h1>
          <p className="text-sm text-muted-foreground">{t("contactsHint")}</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@username"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </div>
          <Button onClick={handleContactsSubmit} disabled={saving || (!contactEmail && !telegram && !whatsapp)}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {tCommon("continue")}
          </Button>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold">{t("doneTitle")}</h1>
          <p className="text-muted-foreground">{t("doneBody")}</p>
          <p className="rounded-lg bg-surface px-4 py-2 font-mono text-sm">vitrin.work/{username}</p>
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/${username}`)}>{t("openPage")}</Button>
            <Button
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(`https://vitrin.work/${username}`)}
            >
              {tCommon("copyLink")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
