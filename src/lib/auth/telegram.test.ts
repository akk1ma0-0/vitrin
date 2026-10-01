import { createHash, createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyTelegramAuth } from "@/lib/auth/telegram";

const BOT_TOKEN = "123456:test-bot-token";

function sign(fields: Record<string, string>): Record<string, string> {
  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secretKey = createHash("sha256").update(BOT_TOKEN).digest();
  const hash = createHmac("sha256", secretKey).update(checkString).digest("hex");
  return { ...fields, hash };
}

describe("verifyTelegramAuth", () => {
  it("accepts a correctly signed, fresh payload", () => {
    const fields = sign({ id: "42", first_name: "Ada", auth_date: String(Math.floor(Date.now() / 1000)) });
    const result = verifyTelegramAuth(fields, BOT_TOKEN);
    expect(result).toEqual({ id: "42", first_name: "Ada", auth_date: fields.auth_date });
  });

  it("rejects a tampered field", () => {
    const fields = sign({ id: "42", first_name: "Ada", auth_date: String(Math.floor(Date.now() / 1000)) });
    fields.first_name = "Eve";
    expect(verifyTelegramAuth(fields, BOT_TOKEN)).toBeNull();
  });

  it("rejects the wrong bot token", () => {
    const fields = sign({ id: "42", auth_date: String(Math.floor(Date.now() / 1000)) });
    expect(verifyTelegramAuth(fields, "other-token")).toBeNull();
  });

  it("rejects a stale auth_date", () => {
    const staleDate = String(Math.floor(Date.now() / 1000) - 90_000);
    const fields = sign({ id: "42", auth_date: staleDate });
    expect(verifyTelegramAuth(fields, BOT_TOKEN)).toBeNull();
  });

  it("rejects a missing hash", () => {
    expect(verifyTelegramAuth({ id: "42", auth_date: "123" }, BOT_TOKEN)).toBeNull();
  });
});
