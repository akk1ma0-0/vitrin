import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { parseContacts } from "@/lib/contacts";
import { getOverviewStats } from "@/lib/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardOverviewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { count: worksCount } = await supabase
    .from("works")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id);

  const stats = await getOverviewStats(user.id);
  const { data: recentRequests } = await supabase
    .from("hire_requests")
    .select("id, name, message, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const t = await getTranslations("dashboard.overview");

  const checklist = [
    { done: Boolean(profile?.avatar_url), label: t("checklistAvatar") },
    { done: Boolean(profile?.bio), label: t("checklistBio") },
    { done: (worksCount ?? 0) >= 3, label: t("checklistWorks") },
    { done: parseContacts(profile?.contacts).length > 0, label: t("checklistContacts") },
    { done: Boolean(profile?.email_verified), label: t("checklistEmail") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t("yourPage")}:</span>
          <span className="font-mono">vitrin.work/{profile?.username}</span>
          <CopyLinkButton url={`https://vitrin.work/${profile?.username}`} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("views7d")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.views7d}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("expands7d")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.expands7d}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("requests7d")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.requests7d}</CardContent>
        </Card>
      </div>

      {checklist.some((c) => !c.done) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("checklistTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  <Check className={item.done ? "h-4 w-4 text-emerald-500" : "h-4 w-4 text-muted-foreground/30"} />
                  <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("recentRequests")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests && recentRequests.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {recentRequests.map((r) => (
                <li key={r.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{r.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
          <Button asChild variant="link" className="mt-2 px-0">
            <Link href="/dashboard/inbox">View all</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
