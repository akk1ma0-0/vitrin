import { getTranslations } from "next-intl/server";

import { assertLocaleHandle } from "@/lib/handle";

export default async function PrivacyPage({ params }: PageProps<"/[handle]/privacy">) {
  const { handle } = await params;
  assertLocaleHandle(handle);
  const t = await getTranslations("legal");

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose prose-sm dark:prose-invert">
      <h1>{t("privacy")}</h1>
      <p className="text-muted-foreground">{t("lastUpdated", { date: "2026-01-01" })}</p>

      <h2>1. What we collect</h2>
      <p>
        Account data (email, name, avatar), the profile content you create (bio, links, works), and
        hire requests submitted through your page. We do not use third-party advertising trackers.
      </p>

      <h2>2. Analytics</h2>
      <p>
        We record anonymous page-view and click events for your own dashboard stats. Visitors are
        identified only by a one-way hash of their IP address, user agent and a salt that rotates
        daily — we never store raw IP addresses, and we do not use cookies for this analytics.
      </p>

      <h2>3. How we use your data</h2>
      <p>
        To operate your portfolio page, process hire requests, send transactional email, and (for
        Pro subscribers) process payments via Paddle.
      </p>

      <h2>4. Third parties</h2>
      <p>
        We use Supabase (hosting/database), Resend (email), Cloudflare (bot protection), Google Web
        Risk and OpenAI Moderation (safety checks on links and content), and Paddle (payments). Each
        processes data only as needed to provide their service to us.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You can export your data or permanently delete your account and all associated data from
        Settings at any time. Contact hello@vitrin.work for any other data request.
      </p>

      <h2>6. Contact</h2>
      <p>hello@vitrin.work</p>
    </article>
  );
}
