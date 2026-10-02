"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactsEditor, cleanContacts, validateContacts } from "@/components/contacts-editor";
import { parseContacts, type ContactEntry } from "@/lib/contacts";
import { SPECIALIZATIONS, type Specialization } from "@/lib/specializations";
import type { PublicProfile } from "@/lib/profiles";

export function ProfileEditForm({ profile, accountEmail }: { profile: PublicProfile; accountEmail: string }) {
  const t = useTranslations("dashboard.profile");
  const tOnboarding = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tSpec = useTranslations("specializations");
  const tContacts = useTranslations("contacts");

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [specialization, setSpecialization] = useState<Specialization>(
    (profile.specialization as Specialization) ?? "other",
  );
  const [availableForWork, setAvailableForWork] = useState(profile.available_for_work);
  const [rateMin, setRateMin] = useState(profile.rate_min != null ? String(profile.rate_min) : "");
  const [rateMax, setRateMax] = useState(profile.rate_max != null ? String(profile.rate_max) : "");
  const [rateCurrency, setRateCurrency] = useState(profile.rate_currency);
  const [rateUnit, setRateUnit] = useState<"hour" | "project" | "none">(profile.rate_unit ?? "none");
  const [contacts, setContacts] = useState<ContactEntry[]>(() => {
    const parsed = parseContacts(profile.contacts);
    return parsed.some((c) => c.type === "email") ? parsed : [{ type: "email", value: accountEmail }, ...parsed];
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const contactsError = validateContacts(contacts);
    if (contactsError) {
      toast.error(tContacts(contactsError));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          headline,
          bio,
          specialization,
          availableForWork,
          rateMin: rateMin === "" ? null : Number(rateMin),
          rateMax: rateMax === "" ? null : Number(rateMax),
          rateCurrency,
          rateUnit: rateUnit === "none" ? null : rateUnit,
          contacts: cleanContacts(contacts),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <div className="flex flex-col gap-1.5">
        <Label>{tOnboarding("displayNameLabel")}</Label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{tOnboarding("specializationLabel")}</Label>
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
        <Label>{tOnboarding("headlineLabel")}</Label>
        <Input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={80} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Bio</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={600} rows={4} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <span className="text-sm font-medium">Open to work</span>
        <Switch checked={availableForWork} onCheckedChange={setAvailableForWork} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold">{t("rateTitle")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("rateMinLabel")}</Label>
            <Input
              value={rateMin}
              onChange={(e) => setRateMin(e.target.value)}
              type="number"
              min={0}
              inputMode="numeric"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("rateMaxLabel")}</Label>
            <Input
              value={rateMax}
              onChange={(e) => setRateMax(e.target.value)}
              type="number"
              min={0}
              inputMode="numeric"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("rateCurrencyLabel")}</Label>
            <Input
              value={rateCurrency}
              onChange={(e) => setRateCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              className="uppercase"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("rateUnitLabel")}</Label>
            <Select value={rateUnit} onValueChange={(v) => setRateUnit(v as "hour" | "project" | "none")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("rateUnitNone")}</SelectItem>
                <SelectItem value="hour">{t("rateUnitHour")}</SelectItem>
                <SelectItem value="project">{t("rateUnitProject")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold">{tContacts("title")}</h2>
        <ContactsEditor value={contacts} onChange={setContacts} />
      </div>

      <Button onClick={handleSave} disabled={saving} className="self-start">
        {tCommon("save")}
      </Button>
    </div>
  );
}
