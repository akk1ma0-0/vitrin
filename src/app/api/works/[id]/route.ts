import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { WORK_CATEGORIES } from "@/lib/specializations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  result: z.string().max(200).optional(),
  category: z.enum(WORK_CATEGORIES).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  isHidden: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { isHidden, ...rest } = parsed.data;

  // RLS (`owners manage their own works`) enforces that this only ever touches the caller's own row.
  const { error } = await supabase
    .from("works")
    .update({ ...rest, ...(isHidden !== undefined ? { is_hidden: isHidden } : {}) })
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase.from("works").delete().eq("id", id).eq("profile_id", user.id);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
