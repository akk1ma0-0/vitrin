import { ModerationQueue } from "@/components/admin/moderation-queue";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const [flaggedWorks, openReports] = await Promise.all([
    supabase
      .from("works")
      .select("id, title, source_url, profile_id, moderation_status, safety_status")
      .in("moderation_status", ["flagged"])
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ModerationQueue
      flaggedWorks={flaggedWorks.data ?? []}
      openReports={openReports.data ?? []}
    />
  );
}
