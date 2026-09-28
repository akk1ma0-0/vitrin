import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ orderedIds: z.array(z.string().uuid()).min(1) });

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  await Promise.all(
    parsed.data.orderedIds.map((id, position) =>
      supabase.from("works").update({ position }).eq("id", id).eq("profile_id", user.id),
    ),
  );

  return NextResponse.json({ ok: true });
}
