import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** GDPR data export (spec section 5.7): everything the account owns, as JSON. */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [profile, works, hireRequests] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("works").select("*").eq("profile_id", user.id),
    supabase.from("hire_requests").select("*").eq("profile_id", user.id),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: profile.data,
    works: works.data,
    hireRequests: hireRequests.data,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=vitrin-export.json",
    },
  });
}
