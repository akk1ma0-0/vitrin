import { NextResponse, type NextRequest } from "next/server";

import { validateUsernameFormat } from "@/lib/reserved-usernames";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username") ?? "";

  const format = validateUsernameFormat(username);
  if (!format.valid) {
    return NextResponse.json({ available: false, error: format.error });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    return NextResponse.json({ available: !data });
  } catch {
    return NextResponse.json({ available: false, error: "lookup_failed" }, { status: 503 });
  }
}
