import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const headerList = await headers();
    const headerLocale = headerList.get("x-vitrin-locale");
    const locale = headerLocale && isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/dashboard");

  return <OnboardingWizard initialEmail={user.email ?? ""} />;
}
