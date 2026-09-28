import { describe, expect, it } from "vitest";

import { isBlockedIp } from "@/lib/ingest/ssrf-guard";

describe("isBlockedIp", () => {
  it("blocks loopback", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
  });

  it("blocks private class A", () => {
    expect(isBlockedIp("10.1.2.3")).toBe(true);
  });

  it("blocks private class B range", () => {
    expect(isBlockedIp("172.16.5.1")).toBe(true);
    expect(isBlockedIp("172.31.255.255")).toBe(true);
  });

  it("does not block a class B address outside the private range", () => {
    expect(isBlockedIp("172.32.0.1")).toBe(false);
  });

  it("blocks private class C", () => {
    expect(isBlockedIp("192.168.1.1")).toBe(true);
  });

  it("blocks link-local", () => {
    expect(isBlockedIp("169.254.1.1")).toBe(true);
  });

  it("blocks CGNAT range", () => {
    expect(isBlockedIp("100.64.0.1")).toBe(true);
  });

  it("allows a public IPv4 address", () => {
    expect(isBlockedIp("8.8.8.8")).toBe(false);
  });

  it("blocks IPv6 loopback", () => {
    expect(isBlockedIp("::1")).toBe(true);
  });

  it("blocks IPv6 unique local addresses", () => {
    expect(isBlockedIp("fd00::1")).toBe(true);
  });

  it("blocks IPv6 link-local", () => {
    expect(isBlockedIp("fe80::1")).toBe(true);
  });

  it("allows a public IPv6 address", () => {
    expect(isBlockedIp("2001:4860:4860::8888")).toBe(false);
  });
});
