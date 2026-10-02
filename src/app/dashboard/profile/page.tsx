import { ProfileEditForm } from "@/components/dashboard/profile-edit-form";
import { ConnectedAccountsForm } from "@/components/dashboard/connected-accounts-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  return (
    <>
      <ProfileEditForm profile={profile} accountEmail={user.email ?? ""} />
      <div className="mx-auto mt-6 max-w-2xl">
        <ConnectedAccountsForm />
      </div>
    </>
  );
}
