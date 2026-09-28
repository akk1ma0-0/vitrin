import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Paddle checkout, customer portal and subscription management ship in stage 2 (spec section 7).
export default async function DashboardBillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const t = await getTranslations("dashboard.billing");
  const tCommon = await getTranslations("common");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("currentPlan")}
            <Badge>{profile?.plan === "pro" ? "Pro" : tCommon("free")}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.plan !== "pro" && (
            <Button disabled>{tCommon("comingSoon")}</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
