import { Resend } from "resend";
import type { ReactElement } from "react";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}): Promise<{ ok: boolean }> {
  const resend = getClient();
  if (!resend) {
    // Resend isn't configured yet in this environment (spec section 16) — no-op instead of throwing.
    console.warn("[email] RESEND_API_KEY not set, skipping send:", options.subject);
    return { ok: false };
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Vitrin <hello@vitrin.work>",
    to: options.to,
    subject: options.subject,
    react: options.react,
    replyTo: options.replyTo,
  });

  return { ok: !error };
}
