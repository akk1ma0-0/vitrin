import { ProfileEditForm } from "@/components/dashboard/profile-edit-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  return <ProfileEditForm profile={profile} />;
}
