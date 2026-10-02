"use client";

import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_TYPES, MAX_CONTACTS, type ContactEntry, type ContactType } from "@/lib/contacts";

const PLACEHOLDERS: Record<ContactType, string> = {
  email: "name@example.com",
  telegram: "@username",
  whatsapp: "+1 555 000 0000",
  viber: "+1 555 000 0000",
  phone: "+1 555 000 0000",
  website: "https://",
  linkedin: "https://linkedin.com/in/…",
  github: "https://github.com/…",
  behance: "https://behance.net/…",
  dribbble: "https://dribbble.com/…",
  instagram: "@username",
  x: "@username",
};

const INPUT_TYPES: Partial<Record<ContactType, string>> = {
  email: "email",
  whatsapp: "tel",
  viber: "tel",
  phone: "tel",
};

/** Drops blank rows before saving; editing state keeps them so the user can fill them in. */
export function cleanContacts(entries: ContactEntry[]): ContactEntry[] {
  return entries.map((e) => ({ ...e, value: e.value.trim() })).filter((e) => e.value);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors `contactsSchema` so the form can name the problem instead of a generic save error. */
export function validateContacts(entries: ContactEntry[]): "emailRequired" | "invalidEmail" | null {
  const cleaned = cleanContacts(entries);
  if (!cleaned.some((e) => e.type === "email")) return "emailRequired";
  if (cleaned.some((e) => e.type === "email" && !EMAIL_PATTERN.test(e.value))) return "invalidEmail";
  return null;
}

export function ContactsEditor({
  value,
  onChange,
}: {
  value: ContactEntry[];
  onChange: (next: ContactEntry[]) => void;
}) {
  const t = useTranslations("contacts");
  const emailCount = value.filter((e) => e.type === "email").length;

  function update(index: number, patch: Partial<ContactEntry>) {
    onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((entry, index) => {
        const isLastEmail = entry.type === "email" && emailCount === 1;
        return (
          <div key={index} className="flex items-center gap-2">
            <Select
              value={entry.type}
              onValueChange={(type) => update(index, { type: type as ContactType })}
              disabled={isLastEmail}
            >
              <SelectTrigger className="w-32 shrink-0 sm:w-36" aria-label={t("typeLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={entry.value}
              onChange={(e) => update(index, { value: e.target.value })}
              type={INPUT_TYPES[entry.type] ?? "text"}
              placeholder={PLACEHOLDERS[entry.type]}
              maxLength={200}
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              disabled={isLastEmail}
              aria-label={t("remove")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">{t("emailRequiredHint")}</p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => onChange([...value, { type: "telegram", value: "" }])}
        disabled={value.length >= MAX_CONTACTS}
      >
        <Plus className="h-4 w-4" />
        {t("add")}
      </Button>
    </div>
  );
}
