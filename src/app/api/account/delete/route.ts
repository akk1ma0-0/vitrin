import { NextResponse } from "next/server";

import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

/**
 * Full account deletion (spec section 5.7, GDPR). Deleting the auth user
 * cascades to `profiles` (and from there to `works`, `work_files`,
 * `hire_requests`, `events`) via the `on delete cascade` foreign keys in
 * the migrations. Storage objects are best-effort cleaned up by the
 * `cleanup` cron job (spec section 9) since they aren't DB rows.
 */
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
