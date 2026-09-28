import { isLocale } from "@/i18n/locales";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

/**
 * Marketing chrome (header/footer) only applies when `handle` is a locale
 * code. A username handle renders its own full-page layout in
 * PublicProfileView, so this layout passes children through untouched.
 */
export default async function HandleLayout({
  children,
  params,
}: LayoutProps<"/[handle]">) {
  const { handle } = await params;

  if (isLocale(handle)) {
    return (
      <>
        <SiteHeader locale={handle} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={handle} />
      </>
    );
  }

  return <>{children}</>;
}
