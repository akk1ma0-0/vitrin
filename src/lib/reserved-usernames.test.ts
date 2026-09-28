import { describe, expect, it } from "vitest";

import { isReservedUsername, validateUsernameFormat } from "@/lib/reserved-usernames";

describe("isReservedUsername", () => {
  it("blocks locale codes", () => {
    expect(isReservedUsername("en")).toBe(true);
    expect(isReservedUsername("RU")).toBe(true);
    expect(isReservedUsername("pt-br")).toBe(true);
  });

  it("blocks service routes", () => {
    expect(isReservedUsername("dashboard")).toBe(true);
    expect(isReservedUsername("admin")).toBe(true);
    expect(isReservedUsername("api")).toBe(true);
  });

  it("blocks the brand name", () => {
    expect(isReservedUsername("vitrin")).toBe(true);
  });

  it("allows a normal username", () => {
    expect(isReservedUsername("johndoe")).toBe(false);
  });
});

describe("validateUsernameFormat", () => {
  it("accepts a valid username", () => {
    expect(validateUsernameFormat("john_doe-92")).toEqual({ valid: true });
  });

  it("rejects too short", () => {
    expect(validateUsernameFormat("ab")).toEqual({ valid: false, error: "too_short" });
  });

  it("rejects too long", () => {
    expect(validateUsernameFormat("a".repeat(31))).toEqual({ valid: false, error: "too_long" });
  });

  it("rejects starting with a digit", () => {
    expect(validateUsernameFormat("1abc")).toEqual({ valid: false, error: "invalid_format" });
  });

  it("rejects invalid characters", () => {
    expect(validateUsernameFormat("john.doe")).toEqual({ valid: false, error: "invalid_format" });
  });

  it("rejects reserved names", () => {
    expect(validateUsernameFormat("dashboard")).toEqual({ valid: false, error: "reserved" });
  });

  it("is case-insensitive", () => {
    expect(validateUsernameFormat("JohnDoe")).toEqual({ valid: true });
    expect(validateUsernameFormat("Dashboard")).toEqual({ valid: false, error: "reserved" });
  });
});
