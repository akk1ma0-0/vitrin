import { Laptop, Smartphone, Tablet } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart";
import { RankedBarList, type RankedBarItem } from "@/components/dashboard/ranked-bar-list";
import { StatSection } from "@/components/dashboard/stat-section";
import { getFullStats, getOverviewStats } from "@/lib/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEVICE_ICONS = { desktop: Laptop, tablet: Tablet, mobile: Smartphone } as const;

function countryLabel(code: string, unknownLabel: string): string {
  if (code === "unknown") return unknownLabel;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export default async function DashboardStatsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const isPro = profile?.plan === "pro";

  const [stats, fullStats, t, tOverview, tDevice] = await Promise.all([
    getOverviewStats(user.id),
    isPro ? getFullStats(user.id) : null,
    getTranslations("dashboard.stats"),
    getTranslations("dashboard.overview"),
    getTranslations("viewer.device"),
  ]);

  const byWorkItems: RankedBarItem[] =
    fullStats?.byWork.map((w) => ({ key: w.label, label: w.label, count: w.count })) ?? [];
  const sourceItems: RankedBarItem[] =
    fullStats?.sources.map((s) => ({
      key: s.label,
      label: s.label === "direct" ? t("direct") : s.label,
      count: s.count,
    })) ?? [];
  const countryItems: RankedBarItem[] =
    fullStats?.countries.map((c) => ({ key: c.label, label: countryLabel(c.label, t("unknown")), count: c.count })) ??
    [];
  const deviceItems: RankedBarItem[] =
    fullStats?.devices.map((d) => {
      const Icon = DEVICE_ICONS[d.device];
      return {
        key: d.device,
        label: (
          <span className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {tDevice(d.device)}
          </span>
        ),
        count: d.count,
      };
    }) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{tOverview("views7d")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.views7d}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{tOverview("expands7d")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.expands7d}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalViews")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.totalViews}</CardContent>
        </Card>
      </div>

      {!isPro && <p className="text-sm text-muted-foreground">{t("upgradeForMore")}</p>}

      <StatSection title={t("dailyViewsTitle")} isPro={isPro}>
        {fullStats && <DailyTrendChart data={fullStats.dailyViews} />}
      </StatSection>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatSection title={t("byWorkTitle")} isPro={isPro}>
          <RankedBarList items={byWorkItems} emptyLabel={t("noDataYet")} />
        </StatSection>
        <StatSection title={t("sourcesTitle")} isPro={isPro}>
          <RankedBarList items={sourceItems} emptyLabel={t("noDataYet")} />
        </StatSection>
        <StatSection title={t("countriesTitle")} isPro={isPro}>
          <RankedBarList items={countryItems} emptyLabel={t("noDataYet")} />
        </StatSection>
        <StatSection title={t("devicesTitle")} isPro={isPro}>
          <RankedBarList items={deviceItems} emptyLabel={t("noDataYet")} />
        </StatSection>
      </div>
    </div>
  );
}
