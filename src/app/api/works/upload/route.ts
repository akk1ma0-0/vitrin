import { NextResponse, type NextRequest } from "next/server";

import { canAddWork, canUploadFile, getPlanLimits } from "@/lib/plans";
import { uniqueSlug } from "@/lib/slug";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { workUploadSchema } from "@/lib/validation/schemas";
import type { Json } from "@/lib/supabase/database.types";

const UPLOADS_BUCKET = "uploads";

const RENDER_MODE_BY_KIND = {
  image: "gallery",
  video: "video",
  pdf: "pdf",
} as const;

const SOURCE_TYPE_BY_KIND = {
  image: "upload_image",
  video: "upload_video",
  pdf: "upload_pdf",
} as const;

/**
 * Creates a work from files the browser already uploaded directly to the
 * `uploads` storage bucket (RLS there already scopes writes to the caller's
 * own `{user_id}/...` folder — see 0010_storage_buckets.sql). This route
 * only validates plan limits and creates the works/work_files rows; it
 * never receives the file bytes itself.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = workUploadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }

  const { kind, files } = parsed.data;
  if (kind !== "image" && files.length > 1) {
    return NextResponse.json({ error: "single_file_only" }, { status: 400 });
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
  const plan = profile?.plan ?? "free";

  const { count: worksCount } = await admin
    .from("works")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id);
  if (!canAddWork(plan, worksCount ?? 0)) {
    return NextResponse.json({ error: "plan_limit_reached", limit: getPlanLimits(plan).maxWorks }, { status: 403 });
  }

  const { data: existingFiles } = await admin
    .from("work_files")
    .select("size_bytes, works!inner(profile_id)")
    .eq("works.profile_id", user.id);
  let runningTotal = (existingFiles ?? []).reduce((sum, f) => sum + f.size_bytes, 0);

  for (const file of files) {
    const check = canUploadFile(plan, kind, file.sizeBytes, runningTotal);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }
    runningTotal += file.sizeBytes;
  }

  // Confirm the paths are actually this user's own files in the bucket —
  // the client reports sizes/mime itself, so this is a sanity check, not
  // the authority on what's really there.
  for (const file of files) {
    if (!file.path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "invalid_path" }, { status: 400 });
    }
  }

  const publicUrls = files.map((f) => admin.storage.from(UPLOADS_BUCKET).getPublicUrl(f.path).data.publicUrl);

  const { data: existingSlugRows } = await admin.from("works").select("slug").eq("profile_id", user.id);
  const existingSlugs = new Set((existingSlugRows ?? []).map((w) => w.slug));
  const slug = uniqueSlug(kind, existingSlugs);

  const meta: Json = kind === "image" ? { images: publicUrls } : {};
  // Only an image upload's own file is a valid thumbnail; a video/PDF file
  // URL isn't renderable as an <img> src, so leave the cover unset and let
  // the UI fall back to the source-type icon placeholder.
  const coverUrl = kind === "image" ? publicUrls[0] : null;

  const { data: work, error: workError } = await admin
    .from("works")
    .insert({
      profile_id: user.id,
      slug,
      position: worksCount ?? 0,
      source_url: kind === "image" ? null : publicUrls[0],
      source_type: SOURCE_TYPE_BY_KIND[kind],
      render_mode: RENDER_MODE_BY_KIND[kind],
      cover_url: coverUrl,
      cover_source: coverUrl ? "custom" : null,
      meta,
      safety_status: "safe",
      moderation_status: "approved",
      ingest_status: "ready",
    })
    .select("id")
    .single();

  if (workError || !work) {
    return NextResponse.json({ error: "insert_failed", detail: workError?.message }, { status: 500 });
  }

  const { error: filesError } = await admin.from("work_files").insert(
    files.map((f, i) => ({
      work_id: work.id,
      storage_path: f.path,
      mime: f.mime,
      size_bytes: f.sizeBytes,
      kind,
      position: i,
    })),
  );
  if (filesError) {
    // The work itself was created successfully; a missing work_files row
    // only affects storage-quota accounting going forward, not the work
    // being visible/functional — not worth failing the whole request over.
    console.error("[works/upload] failed to record work_files:", filesError.message);
  }

  return NextResponse.json({ ok: true, workId: work.id });
}
