"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/supabase/database.types";

type HireRequest = Database["public"]["Tables"]["hire_requests"]["Row"];
type Status = HireRequest["status"];

export function InboxView({ initialRequests }: { initialRequests: HireRequest[] }) {
  const t = useTranslations("dashboard.inbox");
  const [requests, setRequests] = useState(initialRequests);
  const [tab, setTab] = useState<Status>("new");

  async function updateStatus(id: string, status: Status) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/hire-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const filtered = requests.filter((r) => r.status === tab);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="new">{t("tabNew")}</TabsTrigger>
          <TabsTrigger value="read">{t("tabRead")}</TabsTrigger>
          <TabsTrigger value="archived">{t("tabArchived")}</TabsTrigger>
          <TabsTrigger value="spam">{t("tabSpam")}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.email}</p>
                    </div>
                    {r.budget && <Badge variant="secondary">{r.budget}</Badge>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{r.message}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" size="sm" asChild>
                      <a href={`mailto:${r.email}`}>{t("reply")}</a>
                    </Button>
                    {r.status === "new" && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "read")}>
                        {t("markRead")}
                      </Button>
                    )}
                    {r.status !== "archived" && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "archived")}>
                        {t("archive")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
