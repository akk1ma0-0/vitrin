/**
 * Interface locales (spec section 10). `en` is the fallback.
 * Locale codes here double as reserved usernames and as the marketing
 * route handle — see src/lib/reserved-usernames.ts and src/app/[handle].
 */
export const LOCALES = [
  "en", "es", "pt-BR", "ru", "ro", "de", "fr", "tr", "uk", "pl",
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

const LOCALE_SET = new Set<string>(LOCALES.map((l) => l.toLowerCase()));

export function isLocale(value: string): value is Locale {
  return LOCALE_SET.has(value.toLowerCase());
}

/** Normalizes an arbitrary handle segment to its canonical locale casing (pt-br -> pt-BR), or null. */
export function normalizeLocale(value: string): Locale | null {
  const lower = value.toLowerCase();
  const match = LOCALES.find((l) => l.toLowerCase() === lower);
  return match ?? null;
}

const LOCALE_TO_BCP47: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  "pt-BR": "pt-BR",
  ru: "ru-RU",
  ro: "ro-RO",
  de: "de-DE",
  fr: "fr-FR",
  tr: "tr-TR",
  uk: "uk-UA",
  pl: "pl-PL",
};

export function toBcp47(locale: Locale): string {
  return LOCALE_TO_BCP47[locale];
}

/** Picks the best supported locale from an `Accept-Language` header value. */
export function pickLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      return { tag: tag.trim(), q: qPart ? Number(qPart) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const exact = normalizeLocale(tag);
    if (exact) return exact;

    const base = tag.split("-")[0];
    const baseMatch = normalizeLocale(base);
    if (baseMatch) return baseMatch;
  }

  return DEFAULT_LOCALE;
}
