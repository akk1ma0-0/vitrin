import { SettingsView } from "@/components/dashboard/settings-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  return <SettingsView profile={profile} />;
}
