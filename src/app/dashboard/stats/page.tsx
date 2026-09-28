import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverviewStats } from "@/lib/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardStatsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const stats = await getOverviewStats(user.id);
  const t = await getTranslations("dashboard.stats");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalViews")}</CardTitle>
        </CardHeader>
        <CardContent className="text-4xl font-semibold">{stats.totalViews}</CardContent>
      </Card>

      {profile?.plan !== "pro" && (
        <p className="text-sm text-muted-foreground">{t("upgradeForMore")}</p>
      )}
    </div>
  );
}
