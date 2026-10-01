import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
}

const MAX_AUTH_AGE_SECONDS = 86_400;

/**
 * Verifies the Telegram Login Widget's signed payload (spec:
 * https://core.telegram.org/widgets/login#checking-authorization). Returns
 * the verified fields, or null if the hash is wrong, missing, or stale.
 */
export function verifyTelegramAuth(
  params: Record<string, string>,
  botToken: string,
): TelegramAuthData | null {
  const { hash, ...fields } = params;
  if (!hash || !fields.id || !fields.auth_date) return null;

  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(checkString).digest("hex");

  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(fields.auth_date);
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) {
    return null;
  }

  return fields as unknown as TelegramAuthData;
}
