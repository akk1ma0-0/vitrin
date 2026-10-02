import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/logo";
import type { Locale } from "@/i18n/locales";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <Link href={`/${locale}`} className="py-2">
          <Logo />
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-4">
          <Link href={`/${locale}/pricing`} className="py-3 hover:text-foreground">
            Pricing
          </Link>
          <Link href={`/${locale}/terms`} className="py-3 hover:text-foreground">
            {t("terms")}
          </Link>
          <Link href={`/${locale}/privacy`} className="py-3 hover:text-foreground">
            {t("privacy")}
          </Link>
          <Link href={`/${locale}/refund`} className="py-3 hover:text-foreground">
            {t("refund")}
          </Link>
        </nav>
        <p>
          &copy; {new Date().getFullYear()} Vitrin. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
