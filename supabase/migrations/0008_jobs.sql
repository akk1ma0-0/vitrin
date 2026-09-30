create type public.job_type as enum ('ingest_work', 'recheck_link', 'refresh_screenshot', 'moderate');
create type public.job_status as enum ('queued', 'running', 'done', 'failed');

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  type public.job_type not null,
  payload jsonb not null default '{}'::jsonb,
  status public.job_status not null default 'queued',
  attempts integer not null default 0,
  run_after timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_pending_idx on public.jobs (run_after) where status = 'queued';

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;
-- Service-role only; no policies means no access for anon/authenticated roles.

-- Claims up to `p_limit` due jobs atomically, skipping rows another worker
-- already has locked, so concurrent cron invocations never double-process
-- the same job (spec section 9). Only service_role may ever call this
-- (grant lives in 0012_grants.sql) — it must never be reachable by a
-- visitor or signed-in user via /rest/v1/rpc/claim_jobs.
create or replace function public.claim_jobs(p_limit integer)
returns setof public.jobs
language sql
security definer
set search_path = public
as $$
  update public.jobs
  set status = 'running', attempts = attempts + 1, updated_at = now()
  where id in (
    select id from public.jobs
    where status = 'queued' and run_after <= now()
    order by run_after
    limit p_limit
    for update skip locked
  )
  returning *;
$$;
