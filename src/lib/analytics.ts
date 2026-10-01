import { createHash } from "node:crypto";

/**
 * `visitor_hash = sha256(ip + user_agent + daily salt)` (spec section 4).
 * The salt is derived from a server-only seed plus the current UTC date, so
 * it changes every day without needing a stored/rotated value — no IP is
 * ever persisted.
 */
export function computeVisitorHash(ip: string, userAgent: string, now = new Date()): string {
  const seed = process.env.ANALYTICS_SALT_SEED ?? "vitrin-dev-salt";
  const dayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const dailySalt = createHash("sha256").update(`${seed}:${dayKey}`).digest("hex");

  return createHash("sha256").update(`${ip}:${userAgent}:${dailySalt}`).digest("hex");
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
}

export type DeviceType = "desktop" | "tablet" | "mobile";

export function getDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

/** Vercel sets this header at the edge for every request; null off-Vercel (e.g. local dev). */
export function getCountry(headers: Headers): string | null {
  return headers.get("x-vercel-ip-country");
}

export function getReferrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname;
  } catch {
    return null;
  }
}
