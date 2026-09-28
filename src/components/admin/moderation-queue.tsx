"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/supabase/database.types";

type FlaggedWork = Pick<
  Database["public"]["Tables"]["works"]["Row"],
  "id" | "title" | "source_url" | "profile_id" | "moderation_status" | "safety_status"
>;
type Report = Database["public"]["Tables"]["reports"]["Row"];

export function ModerationQueue({
  flaggedWorks: initialWorks,
  openReports: initialReports,
}: {
  flaggedWorks: FlaggedWork[];
  openReports: Report[];
}) {
  const [works, setWorks] = useState(initialWorks);
  const [reports, setReports] = useState(initialReports);

  async function act(targetType: "profile" | "work", targetId: string, action: string) {
    const res = await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, action }),
    });
    if (!res.ok) {
      toast.error("Action failed");
      return;
    }
    setWorks((prev) => prev.filter((w) => w.id !== targetId));
    setReports((prev) => prev.filter((r) => !(r.target_type === targetType && r.target_id === targetId)));
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-lg font-medium">Flagged works ({works.length})</h2>
        {works.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing flagged.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {works.map((w) => (
              <Card key={w.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {w.title ?? w.source_url}
                    <Badge variant="warning">{w.moderation_status}</Badge>
                    {w.safety_status === "unsafe" && <Badge variant="warning">unsafe</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" onClick={() => act("work", w.id, "approve")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => act("work", w.id, "hide")}>
                    Hide
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => act("work", w.id, "delete")}>
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Open reports ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open reports.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {r.target_type} · {r.reason}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {r.details && <p className="text-sm text-muted-foreground">{r.details}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => act(r.target_type, r.target_id, "hide")}>
                      Hide target
                    </Button>
                    {r.target_type === "profile" && (
                      <Button size="sm" variant="destructive" onClick={() => act("profile", r.target_id, "ban")}>
                        Ban
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => act(r.target_type, r.target_id, "dismiss_report")}>
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
