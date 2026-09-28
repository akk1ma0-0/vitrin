import { describe, expect, it } from "vitest";

import {
  canAddWork,
  canUploadFile,
  getPlanLimits,
  resolvePlanFromSubscription,
} from "@/lib/plans";

describe("getPlanLimits", () => {
  it("free plan caps works at 12", () => {
    expect(getPlanLimits("free").maxWorks).toBe(12);
  });

  it("pro plan allows video/pdf uploads, free does not", () => {
    expect(getPlanLimits("pro").allowedUploadKinds).toContain("video");
    expect(getPlanLimits("free").allowedUploadKinds).not.toContain("video");
  });
});

describe("canAddWork", () => {
  it("allows adding under the limit", () => {
    expect(canAddWork("free", 11)).toBe(true);
  });

  it("blocks adding at the limit", () => {
    expect(canAddWork("free", 12)).toBe(false);
  });

  it("pro has a much higher ceiling", () => {
    expect(canAddWork("pro", 150)).toBe(true);
  });
});

describe("canUploadFile", () => {
  it("blocks video uploads on free", () => {
    const result = canUploadFile("free", "video", 1024, 0);
    expect(result).toEqual({ ok: false, reason: "plan_does_not_allow_video" });
  });

  it("blocks files over the per-file limit", () => {
    const result = canUploadFile("free", "image", 11 * 1024 * 1024, 0);
    expect(result).toEqual({ ok: false, reason: "file_too_large" });
  });

  it("blocks when total storage quota would be exceeded", () => {
    const result = canUploadFile("free", "image", 5 * 1024 * 1024, 96 * 1024 * 1024);
    expect(result).toEqual({ ok: false, reason: "storage_quota_exceeded" });
  });

  it("allows a valid upload within limits", () => {
    const result = canUploadFile("free", "image", 5 * 1024 * 1024, 0);
    expect(result).toEqual({ ok: true });
  });
});

describe("resolvePlanFromSubscription", () => {
  it("returns free when there is no subscription", () => {
    expect(resolvePlanFromSubscription(null, null)).toBe("free");
  });

  it("returns pro while active/trialing/past_due", () => {
    expect(resolvePlanFromSubscription("active", null)).toBe("pro");
    expect(resolvePlanFromSubscription("trialing", null)).toBe("pro");
    expect(resolvePlanFromSubscription("past_due", null)).toBe("pro");
  });

  it("stays pro after cancellation until the period ends", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    expect(resolvePlanFromSubscription("canceled", future)).toBe("pro");
  });

  it("drops to free after cancellation once the period has ended", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    expect(resolvePlanFromSubscription("canceled", past)).toBe("free");
  });
});
