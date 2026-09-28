/**
 * Reserved / blocked usernames (spec section 3). Checked case-insensitively
 * against the lower-cased candidate before a username is accepted.
 */

// All ISO 639-1 language codes, so `/{code}` never collides with a profile.
const ISO_639_1_CODES = [
  "aa", "ab", "ae", "af", "ak", "am", "an", "ar", "as", "av", "ay", "az",
  "ba", "be", "bg", "bh", "bi", "bm", "bn", "bo", "br", "bs",
  "ca", "ce", "ch", "co", "cr", "cs", "cu", "cv", "cy",
  "da", "de", "dv", "dz",
  "ee", "el", "en", "eo", "es", "et", "eu",
  "fa", "ff", "fi", "fj", "fo", "fr", "fy",
  "ga", "gd", "gl", "gn", "gu", "gv",
  "ha", "he", "hi", "ho", "hr", "ht", "hu", "hy", "hz",
  "ia", "id", "ie", "ig", "ii", "ik", "io", "is", "it", "iu",
  "ja", "jv",
  "ka", "kg", "ki", "kj", "kk", "kl", "km", "kn", "ko", "kr", "ks", "ku", "kv", "kw", "ky",
  "la", "lb", "lg", "li", "ln", "lo", "lt", "lu", "lv",
  "mg", "mh", "mi", "mk", "ml", "mn", "mr", "ms", "mt", "my",
  "na", "nb", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv", "ny",
  "oc", "oj", "om", "or", "os",
  "pa", "pi", "pl", "ps", "pt",
  "qu",
  "rm", "rn", "ro", "ru", "rw",
  "sa", "sc", "sd", "se", "sg", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw",
  "ta", "te", "tg", "th", "ti", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty",
  "ug", "uk", "ur", "uz",
  "ve", "vi", "vo",
  "wa", "wo",
  "xh",
  "yi", "yo",
  "za", "zh", "zu",
  "pt-br",
];

// Service routes reserved at the root, plus app-wide constants.
const SERVICE_ROUTES = [
  "dashboard", "admin", "api", "login", "signup", "logout", "onboarding",
  "catalog", "pricing", "terms", "privacy", "refund", "w", "settings",
  "help", "support", "blog", "about", "static", "assets", "_next",
  "vitrin", "www", "app", "mail", "email", "ftp", "root", "billing",
  "checkout", "webhooks", "webhook", "cron", "images", "img", "fonts",
  "cdn", "docs", "status", "404", "500", "auth", "oauth", "sitemap",
  "robots", "favicon", "manifest", "sw", "public", "share", "hire",
  "contact", "legal", "security", "moderation", "report", "reports",
  "inbox", "profile", "profiles", "works", "work", "users", "user",
  "notifications", "search", "explore", "new", "edit", "delete",
];

// Minimal stop-list of slurs / offensive terms (kept intentionally short here;
// extend via env-configurable list or DB table before opening registration
// to the public — this is not a substitute for the automated moderation
// pipeline in section 8.1).
const OFFENSIVE_TERMS = [
  "fuck", "shit", "bitch", "asshole", "nigger", "faggot", "cunt", "whore",
  "porn", "pussy", "dick", "cock", "slut",
  "хуй", "пизда", "блядь", "ебан", "сука", "гандон", "мудак",
];

const KNOWN_BRANDS = [
  "google", "facebook", "instagram", "twitter", "apple", "microsoft",
  "amazon", "netflix", "youtube", "tiktok", "linkedin", "github",
  "figma", "adobe", "paypal", "stripe", "paddle", "vercel", "supabase",
  "telegram", "whatsapp", "discord", "spotify", "behance", "dribbble",
];

export const RESERVED_USERNAMES: ReadonlySet<string> = new Set(
  [...ISO_639_1_CODES, ...SERVICE_ROUTES, ...OFFENSIVE_TERMS, ...KNOWN_BRANDS].map((s) =>
    s.toLowerCase(),
  ),
);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

const USERNAME_PATTERN = /^[a-z][a-z0-9_-]{2,29}$/;

export interface UsernameValidationResult {
  valid: boolean;
  error?: "invalid_format" | "too_short" | "too_long" | "reserved";
}

export function validateUsernameFormat(usernameRaw: string): UsernameValidationResult {
  const username = usernameRaw.toLowerCase();

  if (username.length < 3) return { valid: false, error: "too_short" };
  if (username.length > 30) return { valid: false, error: "too_long" };
  if (!USERNAME_PATTERN.test(username)) return { valid: false, error: "invalid_format" };
  if (isReservedUsername(username)) return { valid: false, error: "reserved" };

  return { valid: true };
}
