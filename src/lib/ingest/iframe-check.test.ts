import { describe, expect, it } from "vitest";

import { isIframeAllowed } from "@/lib/ingest/iframe-check";

describe("isIframeAllowed", () => {
  it("allows when no relevant headers are present", () => {
    expect(isIframeAllowed(new Headers())).toBe(true);
  });

  it("blocks X-Frame-Options: DENY", () => {
    expect(isIframeAllowed(new Headers({ "x-frame-options": "DENY" }))).toBe(false);
  });

  it("blocks X-Frame-Options: SAMEORIGIN", () => {
    expect(isIframeAllowed(new Headers({ "x-frame-options": "sameorigin" }))).toBe(false);
  });

  it("blocks CSP frame-ancestors 'none'", () => {
    const headers = new Headers({ "content-security-policy": "frame-ancestors 'none'" });
    expect(isIframeAllowed(headers)).toBe(false);
  });

  it("allows CSP frame-ancestors *", () => {
    const headers = new Headers({ "content-security-policy": "frame-ancestors *" });
    expect(isIframeAllowed(headers)).toBe(true);
  });

  it("allows CSP frame-ancestors that explicitly lists our origin", () => {
    const headers = new Headers({
      "content-security-policy": "frame-ancestors 'self' https://vitrin.work",
    });
    expect(isIframeAllowed(headers)).toBe(true);
  });

  it("blocks CSP frame-ancestors that lists other origins only", () => {
    const headers = new Headers({
      "content-security-policy": "frame-ancestors https://example.com",
    });
    expect(isIframeAllowed(headers)).toBe(false);
  });
});
