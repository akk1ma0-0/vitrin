import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Falls back to allow-all when Upstash isn't configured yet in this
 * environment, so local/dev flows aren't blocked before the owner sets up
 * an Upstash database (spec section 16).
 */
function buildLimiter(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
  });
}

// Spec section 5.6: 3 hire requests / hour / IP hash, 20 / day / profile from one sender.
const hireByIpLimiter = buildLimiter(3, "1 h");
const hireByProfileLimiter = buildLimiter(20, "1 d");
const reportLimiter = buildLimiter(10, "1 h");

// Spec section 7: login needs a rate limit alongside Turnstile. 10/15min is
// generous enough for someone genuinely mistyping a password a few times,
// tight enough to make a brute-force sweep impractical.
const loginLimiter = buildLimiter(10, "15 m");
// Fires on every keystroke in the username field (debounced client-side,
// but still frequent by design) — generous so normal typing never trips it.
const usernameCheckLimiter = buildLimiter(30, "1 m");
// /api/events fires on every page view / work expand / click across the
// whole public site — generous per-IP ceiling just to stop a scripted flood.
const eventsLimiter = buildLimiter(60, "1 m");

export async function checkHireRateLimit(
  ipHash: string,
  profileId: string,
): Promise<{ ok: true } | { ok: false; reason: "ip" | "profile" }> {
  if (hireByIpLimiter) {
    const { success } = await hireByIpLimiter.limit(`hire:ip:${ipHash}`);
    if (!success) return { ok: false, reason: "ip" };
  }
  if (hireByProfileLimiter) {
    const { success } = await hireByProfileLimiter.limit(`hire:profile:${ipHash}:${profileId}`);
    if (!success) return { ok: false, reason: "profile" };
  }
  return { ok: true };
}

export async function checkReportRateLimit(ipHash: string): Promise<boolean> {
  if (!reportLimiter) return true;
  const { success } = await reportLimiter.limit(`report:${ipHash}`);
  return success;
}

export async function checkLoginRateLimit(ipHash: string): Promise<boolean> {
  if (!loginLimiter) return true;
  const { success } = await loginLimiter.limit(`login:${ipHash}`);
  return success;
}

export async function checkUsernameCheckRateLimit(ipHash: string): Promise<boolean> {
  if (!usernameCheckLimiter) return true;
  const { success } = await usernameCheckLimiter.limit(`username-check:${ipHash}`);
  return success;
}

export async function checkEventsRateLimit(ipHash: string): Promise<boolean> {
  if (!eventsLimiter) return true;
  const { success } = await eventsLimiter.limit(`events:${ipHash}`);
  return success;
}
