import { describe, expect, it } from "vitest";

import { slugify, uniqueSlug } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and dashes a hostname", () => {
    expect(slugify("My-Site.com")).toBe("my-site-com");
  });

  it("strips accents", () => {
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
  });

  it("falls back to 'work' for empty input", () => {
    expect(slugify("!!!")).toBe("work");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when unused", () => {
    expect(uniqueSlug("example.com", new Set())).toBe("example-com");
  });

  it("appends -2 when the base is taken", () => {
    expect(uniqueSlug("example.com", new Set(["example-com"]))).toBe("example-com-2");
  });

  it("finds the next free suffix", () => {
    const existing = new Set(["example-com", "example-com-2", "example-com-3"]);
    expect(uniqueSlug("example.com", existing)).toBe("example-com-4");
  });
});
