import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  targetType: z.enum(["profile", "work"]),
  targetId: z.string().uuid(),
  action: z.enum(["approve", "hide", "delete", "ban", "dismiss_report"]),
  note: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: actor } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (actor?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { targetType, targetId, action, note } = parsed.data;
  const admin = createSupabaseServiceRoleClient();

  if (action === "approve") {
    await admin.from("works").update({ moderation_status: "approved" }).eq("id", targetId);
  } else if (action === "hide") {
    if (targetType === "profile") {
      await admin.from("profiles").update({ status: "hidden" }).eq("id", targetId);
    } else {
      await admin.from("works").update({ is_hidden: true }).eq("id", targetId);
    }
  } else if (action === "delete") {
    await admin.from("works").delete().eq("id", targetId);
  } else if (action === "ban") {
    await admin.from("profiles").update({ status: "banned" }).eq("id", targetId);
  } else if (action === "dismiss_report") {
    await admin
      .from("reports")
      .update({ status: "dismissed", resolved_by: user.id, resolution_note: note })
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("status", "open");
  }

  if (action !== "dismiss_report") {
    // Any open reports on this target are resolved by the same action that addressed it.
    await admin
      .from("reports")
      .update({ status: "resolved", resolved_by: user.id, resolution_note: note })
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("status", "open");
  }

  await admin.from("moderation_log").insert({
    actor_id: user.id,
    target_type: targetType,
    target_id: targetId,
    action,
    note: note ?? null,
  });

  return NextResponse.json({ ok: true });
}
