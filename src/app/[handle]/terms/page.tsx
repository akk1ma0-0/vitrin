import { getTranslations } from "next-intl/server";

import { assertLocaleHandle } from "@/lib/handle";

export default async function TermsPage({ params }: PageProps<"/[handle]/terms">) {
  const { handle } = await params;
  assertLocaleHandle(handle);
  const t = await getTranslations("legal");

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose prose-sm dark:prose-invert">
      <h1>{t("terms")}</h1>
      <p className="text-muted-foreground">{t("lastUpdated", { date: "2026-01-01" })}</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Vitrin (vitrin.work), operated from the
        European Union. By creating an account or using the service, you agree to these Terms.
      </p>

      <h2>1. The service</h2>
      <p>
        Vitrin lets you build a portfolio page from links to your work. Free and Pro plans are
        described on our Pricing page; features and limits may change with notice.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for the accuracy of the content you publish and for keeping your
        account credentials secure. You must be at least 16 years old to use Vitrin.
      </p>

      <h2>3. Acceptable use</h2>
      <p>
        You may not use Vitrin to host or link to illegal content, malware, content that infringes
        someone else&apos;s rights, or material that is sexually explicit involving minors, hateful, or
        fraudulent. We may remove content or suspend accounts that violate this policy, per our
        moderation process.
      </p>

      <h2>4. Content ownership</h2>
      <p>
        You retain ownership of the content you upload. You grant Vitrin a license to host, display
        and process it as needed to operate the service (e.g. generating screenshots and previews).
      </p>

      <h2>5. Payments</h2>
      <p>
        Paid subscriptions are billed by Paddle.com as our merchant of record, who handles payment
        processing, taxes and invoicing. See our Refund Policy for cancellation terms.
      </p>

      <h2>6. Termination</h2>
      <p>
        You may delete your account at any time from Settings. We may suspend or terminate accounts
        that violate these Terms.
      </p>

      <h2>7. Disclaimer &amp; liability</h2>
      <p>
        Vitrin is provided &quot;as is&quot; without warranties of any kind. To the extent permitted by law,
        we are not liable for indirect or consequential damages arising from your use of the
        service.
      </p>

      <h2>8. Contact</h2>
      <p>Questions about these Terms: hello@vitrin.work</p>
    </article>
  );
}
