/**
 * Determines whether a page can legally be embedded in our iframe
 * (spec section 5.3 step 5). Pure function over response headers so it
 * stays unit-testable independent of the network call that fetches them.
 */
export function isIframeAllowed(headers: Headers, ownOrigin = "https://vitrin.work"): boolean {
  const xfo = headers.get("x-frame-options")?.toLowerCase().trim();
  if (xfo === "deny" || xfo === "sameorigin") {
    return false;
  }

  const csp = headers.get("content-security-policy");
  if (csp) {
    const match = csp.match(/frame-ancestors\s+([^;]+)/i);
    if (match) {
      const sources = match[1].trim().split(/\s+/).map((s) => s.toLowerCase());
      if (sources.includes("'none'")) return false;
      if (!sources.includes("*") && !sources.includes(ownOrigin.toLowerCase())) {
        return false;
      }
    }
  }

  return true;
}
