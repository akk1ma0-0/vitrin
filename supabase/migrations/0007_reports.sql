create type public.report_target_type as enum ('profile', 'work');
create type public.report_reason as enum ('spam', 'nsfw', 'scam', 'copyright', 'offensive', 'other');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason public.report_reason not null,
  details text check (char_length(details) <= 1000),
  reporter_email text,
  reporter_hash text,
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_target_idx on public.reports (target_type, target_id);

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

alter table public.reports enable row level security;

-- Inserts happen only via /api/report using the service-role client
-- (after Turnstile verification), so there is no public insert policy.

create policy "admins read all reports"
  on public.reports for select
  using (public.is_admin());

create policy "admins update reports"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());
