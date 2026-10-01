import { NextResponse, type NextRequest } from "next/server";

import { processWork } from "@/lib/ingest/process-work";
import { recheckLink } from "@/lib/ingest/recheck-link";
import { refreshScreenshot } from "@/lib/ingest/refresh-screenshot";
import { enqueueDueScheduledJobs } from "@/lib/ingest/scheduled-jobs";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const MAX_JOBS_PER_RUN = 10;
const MAX_ATTEMPTS = 3;
const BACKOFF_SECONDS = [30, 120, 600]; // 30s, 2min, 10min

type Job = Database["public"]["Tables"]["jobs"]["Row"];

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function runJob(job: Job): Promise<void> {
  const payload = job.payload as { workId?: string };

  if (job.type === "ingest_work") {
    if (!payload.workId) throw new Error("missing_work_id");
    await processWork(payload.workId);
    return;
  }
  if (job.type === "recheck_link") {
    if (!payload.workId) throw new Error("missing_work_id");
    await recheckLink(payload.workId);
    return;
  }
  if (job.type === "refresh_screenshot") {
    if (!payload.workId) throw new Error("missing_work_id");
    await refreshScreenshot(payload.workId);
    return;
  }
  // moderate ships in stage 2 (spec section 9).
  throw new Error(`unsupported_job_type:${job.type}`);
}

/** Called by Vercel Cron daily, and fire-and-forget right after a work is created. */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Best-effort: a failure here shouldn't block processing whatever's
  // already queued.
  await enqueueDueScheduledJobs().catch(() => {});

  const supabase = createSupabaseServiceRoleClient();
  const { data: jobs, error } = await supabase.rpc("claim_jobs", { p_limit: MAX_JOBS_PER_RUN });

  if (error) {
    return NextResponse.json({ error: "claim_failed", detail: error.message }, { status: 500 });
  }

  const results = await Promise.allSettled((jobs ?? []).map((job) => runJob(job)));

  await Promise.all(
    results.map(async (result, i) => {
      const job = jobs![i];
      if (result.status === "fulfilled") {
        await supabase.from("jobs").update({ status: "done" }).eq("id", job.id);
        return;
      }

      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      if (job.attempts >= MAX_ATTEMPTS) {
        await supabase.from("jobs").update({ status: "failed", last_error: message }).eq("id", job.id);
      } else {
        const backoff = BACKOFF_SECONDS[Math.min(job.attempts - 1, BACKOFF_SECONDS.length - 1)];
        await supabase
          .from("jobs")
          .update({
            status: "queued",
            last_error: message,
            run_after: new Date(Date.now() + backoff * 1000).toISOString(),
          })
          .eq("id", job.id);
      }
    }),
  );

  return NextResponse.json({ processed: jobs?.length ?? 0 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
