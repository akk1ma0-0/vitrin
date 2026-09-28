import { WorksManager } from "@/components/dashboard/works-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardWorksPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const { data: works } = await supabase
    .from("works")
    .select("*")
    .eq("profile_id", user.id)
    .order("position", { ascending: true });

  return <WorksManager initialWorks={works ?? []} plan={profile?.plan ?? "free"} />;
}
