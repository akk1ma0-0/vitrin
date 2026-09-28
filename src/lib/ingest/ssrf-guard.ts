import dns from "node:dns/promises";
import net from "node:net";

/**
 * SSRF protection for the ingest pipeline (spec section 8.4).
 * Resolves the hostname and rejects private / loopback / link-local ranges,
 * only allows ports 80/443, and the caller is responsible for a request
 * timeout and a response-size cap.
 */

const BLOCKED_IPV4_RANGES: Array<[string, number]> = [
  ["127.0.0.0", 8],
  ["10.0.0.0", 8],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["169.254.0.0", 16],
  ["0.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
];

export class SsrfBlockedError extends Error {}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isBlockedIpv4(ip: string): boolean {
  const ipInt = ipv4ToInt(ip);
  return BLOCKED_IPV4_RANGES.some(([base, prefix]) => {
    const baseInt = ipv4ToInt(base);
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipInt & mask) === (baseInt & mask);
  });
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") || // fc00::/7 unique local
    normalized.startsWith("fe80") || // link-local
    normalized === "::"
  );
}

export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isBlockedIpv4(ip);
  if (net.isIPv6(ip)) return isBlockedIpv6(ip);
  return true; // unknown format: fail closed
}

export async function assertSafeUrl(urlString: string): Promise<void> {
  const url = new URL(urlString);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SsrfBlockedError("unsupported_protocol");
  }

  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
  if (port !== 80 && port !== 443) {
    throw new SsrfBlockedError("blocked_port");
  }

  if (net.isIP(url.hostname)) {
    if (isBlockedIp(url.hostname)) throw new SsrfBlockedError("blocked_ip");
    return;
  }

  if (url.hostname === "localhost") {
    throw new SsrfBlockedError("blocked_hostname");
  }

  let addresses: string[];
  try {
    const results = await dns.lookup(url.hostname, { all: true, verbatim: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new SsrfBlockedError("dns_resolution_failed");
  }

  if (addresses.length === 0) {
    throw new SsrfBlockedError("dns_resolution_failed");
  }

  if (addresses.some(isBlockedIp)) {
    throw new SsrfBlockedError("blocked_ip");
  }
}

export const INGEST_FETCH_TIMEOUT_MS = 10_000;
export const INGEST_MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

/** A `fetch` wrapper that enforces the SSRF guard, a timeout, and a response size cap. */
export async function safeIngestFetch(
  urlString: string,
  init: RequestInit = {},
): Promise<Response> {
  await assertSafeUrl(urlString);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INGEST_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(urlString, {
      ...init,
      redirect: "manual", // caller must re-validate each hop with assertSafeUrl
      signal: controller.signal,
      headers: {
        "User-Agent": "VitrinBot/1.0 (+https://vitrin.work)",
        ...init.headers,
      },
    });

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > INGEST_MAX_RESPONSE_BYTES) {
      throw new SsrfBlockedError("response_too_large");
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/** Follows redirects manually, re-running the SSRF guard on every hop. */
export async function safeIngestFetchFollowingRedirects(
  urlString: string,
  init: RequestInit = {},
  maxRedirects = 5,
): Promise<Response> {
  let currentUrl = urlString;
  for (let i = 0; i <= maxRedirects; i++) {
    const response = await safeIngestFetch(currentUrl, init);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) return response;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return response;
  }
  throw new SsrfBlockedError("too_many_redirects");
}
