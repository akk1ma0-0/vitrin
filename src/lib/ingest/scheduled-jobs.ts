import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const PRO_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily
const FREE_RECHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // weekly

type Supabase = ReturnType<typeof createSupabaseServiceRoleClient>;

function isDue(lastCheckedAt: string | null, intervalMs: number, now: number): boolean {
  if (!lastCheckedAt) return true;
  return now - new Date(lastCheckedAt).getTime() >= intervalMs;
}

async function enqueueMissing(
  supabase: Supabase,
  jobType: "recheck_link" | "refresh_screenshot",
  workIds: string[],
): Promise<void> {
  if (workIds.length === 0) return;

  // Skip works that already have a queued/running job of this type, so a
  // backlog (more due works than MAX_JOBS_PER_RUN can process in one cron
  // tick) doesn't pile up duplicate jobs day over day.
  const { data: existing } = await supabase
    .from("jobs")
    .select("payload")
    .eq("type", jobType)
    .in("status", ["queued", "running"]);
  const alreadyQueued = new Set(
    (existing ?? [])
      .map((j) => (j.payload as { workId?: string }).workId)
      .filter((id): id is string => Boolean(id)),
  );

  const toEnqueue = workIds.filter((id) => !alreadyQueued.has(id));
  if (toEnqueue.length === 0) return;

  await supabase.from("jobs").insert(toEnqueue.map((workId) => ({ type: jobType, payload: { workId } })));
}

/**
 * Enqueues `recheck_link` (every work with a source_url, spec section 9:
 * Pro daily / Free weekly) and `refresh_screenshot` (same cadence, only for
 * works stuck in screenshot mode) jobs for whatever's due. Called once at
 * the top of every /api/cron/process-jobs run — there's no separate Vercel
 * Cron schedule for this, since the Hobby plan only allows a daily cron at
 * all (see CLAUDE.md); folding it into the existing one avoids needing a
 * second cron entry.
 */
export async function enqueueDueScheduledJobs(): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const now = Date.now();

  const [{ data: proProfiles }, { data: works }] = await Promise.all([
    supabase.from("profiles").select("id").eq("plan", "pro"),
    supabase.from("works").select("id, render_mode, last_checked_at, profile_id").not("source_url", "is", null),
  ]);

  const proProfileIds = new Set((proProfiles ?? []).map((p) => p.id));

  const dueRecheck: string[] = [];
  const dueScreenshotRefresh: string[] = [];

  for (const work of works ?? []) {
    const interval = proProfileIds.has(work.profile_id) ? PRO_RECHECK_INTERVAL_MS : FREE_RECHECK_INTERVAL_MS;
    if (!isDue(work.last_checked_at, interval, now)) continue;

    dueRecheck.push(work.id);
    if (work.render_mode === "screenshot") dueScreenshotRefresh.push(work.id);
  }

  await Promise.all([
    enqueueMissing(supabase, "recheck_link", dueRecheck),
    enqueueMissing(supabase, "refresh_screenshot", dueScreenshotRefresh),
  ]);
}
