/**
 * Google Web Risk lookup API wrapper (spec section 5.3 step 2 / 8.1).
 * Fails "safe" when the API isn't configured, rather than blocking every
 * link before the owner sets up a Google Cloud project (spec section 16) —
 * but a configured key that errors at request time fails closed (unsafe),
 * since silently treating an API failure as "safe" would defeat the check.
 */
const THREAT_TYPES = ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"] as const;

export async function checkUrlSafety(url: string): Promise<"safe" | "unsafe"> {
  const apiKey = process.env.GOOGLE_WEB_RISK_API_KEY;
  if (!apiKey) return "safe";

  try {
    const params = new URLSearchParams({ key: apiKey, uri: url });
    THREAT_TYPES.forEach((t) => params.append("threatTypes", t));

    const res = await fetch(`https://webrisk.googleapis.com/v1/uris:search?${params.toString()}`);
    if (!res.ok) return "unsafe";

    const data = (await res.json()) as { threat?: unknown };
    return data.threat ? "unsafe" : "safe";
  } catch {
    return "unsafe";
  }
}
