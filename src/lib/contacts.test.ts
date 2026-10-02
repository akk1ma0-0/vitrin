import { describe, expect, it } from "vitest";

import { contactHref, firstContactEmail, parseContacts } from "@/lib/contacts";

describe("parseContacts", () => {
  it("keeps valid entries in order and drops junk", () => {
    const result = parseContacts([
      { type: "email", value: " me@example.com " },
      { type: "fax", value: "123" },
      { type: "telegram", value: "" },
      "nope",
      { type: "whatsapp", value: "+1 555 000" },
    ]);
    expect(result).toEqual([
      { type: "email", value: "me@example.com" },
      { type: "whatsapp", value: "+1 555 000" },
    ]);
  });

  it("returns an empty list for non-array input", () => {
    expect(parseContacts({ email: "me@example.com" })).toEqual([]);
    expect(parseContacts(null)).toEqual([]);
  });
});

describe("firstContactEmail", () => {
  it("returns the first email entry", () => {
    expect(
      firstContactEmail([
        { type: "telegram", value: "me" },
        { type: "email", value: "a@x.com" },
        { type: "email", value: "b@x.com" },
      ]),
    ).toBe("a@x.com");
  });

  it("returns null without an email", () => {
    expect(firstContactEmail([{ type: "telegram", value: "me" }])).toBeNull();
  });
});

describe("contactHref", () => {
  it.each([
    ["@name", "https://t.me/name"],
    ["name", "https://t.me/name"],
    ["t.me/name", "https://t.me/name"],
    ["https://t.me/name/", "https://t.me/name"],
  ])("normalizes telegram %s", (value, expected) => {
    expect(contactHref({ type: "telegram", value })).toBe(expected);
  });

  it("builds phone-based links from digits", () => {
    expect(contactHref({ type: "whatsapp", value: "+1 (555) 000-11" })).toBe("https://wa.me/155500011");
    expect(contactHref({ type: "viber", value: "+373 69 123" })).toBe("viber://chat?number=%2B37369123");
    expect(contactHref({ type: "phone", value: "+373 69 123" })).toBe("tel:+37369123");
  });

  it("adds https:// to bare web links", () => {
    expect(contactHref({ type: "website", value: "example.com" })).toBe("https://example.com");
    expect(contactHref({ type: "linkedin", value: "https://linkedin.com/in/me" })).toBe("https://linkedin.com/in/me");
  });

  it("builds mailto and social handles", () => {
    expect(contactHref({ type: "email", value: "me@example.com" })).toBe("mailto:me@example.com");
    expect(contactHref({ type: "instagram", value: "@me" })).toBe("https://instagram.com/me");
    expect(contactHref({ type: "x", value: "x.com/me" })).toBe("https://x.com/me");
  });
});
