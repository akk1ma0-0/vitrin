import { describe, expect, it } from "vitest";

import { InvalidUrlError, normalizeUrl } from "@/lib/ingest/normalize-url";

describe("normalizeUrl", () => {
  it("adds https to a bare domain", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("upgrades http to https", () => {
    expect(normalizeUrl("http://example.com")).toBe("https://example.com/");
  });

  it("strips utm params", () => {
    expect(normalizeUrl("https://example.com?utm_source=x&utm_campaign=y")).toBe(
      "https://example.com/",
    );
  });

  it("strips known tracking params but keeps real query params", () => {
    expect(normalizeUrl("https://example.com?fbclid=abc&page=2")).toBe(
      "https://example.com/?page=2",
    );
  });

  it("strips the hash fragment", () => {
    expect(normalizeUrl("https://example.com/page#section")).toBe("https://example.com/page");
  });

  it("throws on empty input", () => {
    expect(() => normalizeUrl("")).toThrow(InvalidUrlError);
  });

  it("throws on unparseable input", () => {
    expect(() => normalizeUrl("not a url at all!!")).toThrow(InvalidUrlError);
  });

  it("throws on a javascript: scheme instead of silently prefixing https", () => {
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow(InvalidUrlError);
  });
});
