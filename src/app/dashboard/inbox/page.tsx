import { InboxView } from "@/components/dashboard/inbox-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardInboxPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: requests } = await supabase
    .from("hire_requests")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return <InboxView initialRequests={requests ?? []} />;
}
