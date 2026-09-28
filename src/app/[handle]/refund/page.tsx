import { getTranslations } from "next-intl/server";

import { assertLocaleHandle } from "@/lib/handle";

export default async function RefundPage({ params }: PageProps<"/[handle]/refund">) {
  const { handle } = await params;
  assertLocaleHandle(handle);
  const t = await getTranslations("legal");

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose prose-sm dark:prose-invert">
      <h1>{t("refund")}</h1>
      <p className="text-muted-foreground">{t("lastUpdated", { date: "2026-01-01" })}</p>

      <p>
        Vitrin Pro subscriptions are billed by Paddle.com, our merchant of record, who handles the
        checkout and payment on our behalf.
      </p>

      <h2>Cancelling</h2>
      <p>
        You can cancel your subscription at any time from Billing in your dashboard. Cancelling
        stops future renewals; your Pro features remain active until the end of the period you&apos;ve
        already paid for.
      </p>

      <h2>Refunds</h2>
      <p>
        If you&apos;re unhappy with Vitrin Pro within 14 days of a charge, contact hello@vitrin.work and
        we&apos;ll issue a full refund via Paddle, no questions asked. After 14 days, refunds are granted
        at our discretion (e.g. accidental duplicate charges, billing errors).
      </p>

      <h2>Contact</h2>
      <p>hello@vitrin.work</p>
    </article>
  );
}
