import type { Json } from "@/lib/supabase/database.types";

export const CONTACT_TYPES = [
  "email",
  "telegram",
  "whatsapp",
  "viber",
  "phone",
  "website",
  "linkedin",
  "github",
  "behance",
  "dribbble",
  "instagram",
  "x",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export interface ContactEntry {
  type: ContactType;
  value: string;
}

export const MAX_CONTACTS = 20;

export function isContactType(value: unknown): value is ContactType {
  return typeof value === "string" && (CONTACT_TYPES as readonly string[]).includes(value);
}

/** `profiles.contacts` is an ordered list of `{ type, value }` (0017_contacts_list.sql). */
export function parseContacts(raw: Json | null | undefined): ContactEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: ContactEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const { type, value } = item as { type?: unknown; value?: unknown };
    if (isContactType(type) && typeof value === "string" && value.trim()) {
      entries.push({ type, value: value.trim() });
    }
  }
  return entries;
}

export function firstContactEmail(contacts: ContactEntry[]): string | null {
  return contacts.find((c) => c.type === "email")?.value ?? null;
}

/** "@name", "name", "t.me/name" and "https://instagram.com/name/" all reduce to "name". */
function handle(value: string): string {
  let v = value.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (v.includes("/")) v = v.slice(v.lastIndexOf("/") + 1);
  return v.replace(/^@/, "");
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function absoluteUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function contactHref({ type, value }: ContactEntry): string {
  switch (type) {
    case "email":
      return `mailto:${value.trim()}`;
    case "telegram":
      return `https://t.me/${handle(value)}`;
    case "whatsapp":
      return `https://wa.me/${digits(value)}`;
    case "viber":
      return `viber://chat?number=%2B${digits(value)}`;
    case "phone":
      return `tel:+${digits(value)}`;
    case "instagram":
      return `https://instagram.com/${handle(value)}`;
    case "x":
      return `https://x.com/${handle(value)}`;
    case "website":
    case "linkedin":
    case "github":
    case "behance":
    case "dribbble":
      return absoluteUrl(value);
  }
}

/** Links that open an app or a mail client, rather than a web page, shouldn't get target="_blank". */
export function opensInNewTab(type: ContactType): boolean {
  return type !== "email" && type !== "phone" && type !== "viber";
}
