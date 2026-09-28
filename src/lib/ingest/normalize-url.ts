/**
 * URL normalization for ingest (spec section 5.3 step 1).
 * Forces https, strips known tracking params. Redirect resolution happens
 * separately in the ingest job (requires a network call).
 */
const TRACKING_PARAM_PREFIXES = ["utm_"];
const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "ref",
  "ref_src",
  "ref_url",
  "yclid",
  "_ga",
  "spm",
]);

export class InvalidUrlError extends Error {}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new InvalidUrlError("empty_url");

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new InvalidUrlError("unparseable_url");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new InvalidUrlError("unsupported_protocol");
  }
  // Always upgrade to https; the ingest job's fetch will follow redirects
  // and fall back to whatever the server actually serves.
  url.protocol = "https:";

  const paramsToDelete: string[] = [];
  url.searchParams.forEach((_value, key) => {
    const lower = key.toLowerCase();
    if (TRACKING_PARAMS.has(lower) || TRACKING_PARAM_PREFIXES.some((p) => lower.startsWith(p))) {
      paramsToDelete.push(key);
    }
  });
  paramsToDelete.forEach((key) => url.searchParams.delete(key));

  url.hash = "";

  return url.toString();
}
