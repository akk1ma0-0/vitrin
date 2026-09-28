import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { profileSchema } from "@/lib/validation/schemas";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const USERNAME_COOLDOWN_DAYS = 30;

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = profileSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }

  const input = parsed.data;
  const admin = createSupabaseServiceRoleClient();

  const { data: current } = await admin
    .from("profiles")
    .select("username, username_changed_at, plan, accent_color")
    .eq("id", user.id)
    .single();

  const updates: Record<string, unknown> = { ...input };

  if (input.username && current && input.username !== current.username) {
    if (current.username_changed_at) {
      const daysSinceChange =
        (Date.now() - new Date(current.username_changed_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceChange < USERNAME_COOLDOWN_DAYS) {
        return NextResponse.json(
          { error: "username_change_cooldown", daysRemaining: Math.ceil(USERNAME_COOLDOWN_DAYS - daysSinceChange) },
          { status: 429 },
        );
      }
    }

    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", input.username.toLowerCase())
      .neq("id", user.id)
      .maybeSingle();
    if (taken) {
      return NextResponse.json({ error: "username_taken" }, { status: 409 });
    }

    updates.username_changed_at = new Date().toISOString();
  }

  // Custom accent color is Pro-only (spec section 6); silently keep the default for Free.
  if (input.accentColor && current?.plan !== "pro") {
    delete updates.accentColor;
  }

  const columnMap: Record<string, string> = {
    displayName: "display_name",
    workLanguages: "work_languages",
    rateMin: "rate_min",
    rateMax: "rate_max",
    rateCurrency: "rate_currency",
    rateUnit: "rate_unit",
    availableForWork: "available_for_work",
    accentColor: "accent_color",
    uiLocale: "ui_locale",
  };
  const dbUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    dbUpdates[columnMap[key] ?? key] = value;
  }

  const { error } = await supabase
    .from("profiles")
    .update(dbUpdates as ProfileUpdate)
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: "update_failed", detail: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

const onboardingCompleteSchema = z.object({ onboardingCompleted: z.literal(true) });

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = onboardingCompleteSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { error } = await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
