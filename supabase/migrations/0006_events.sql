create type public.event_type as enum (
  'profile_view', 'work_expand', 'work_open_external', 'hire_click', 'hire_submit', 'contact_click'
);
create type public.device_type as enum ('desktop', 'tablet', 'mobile');

create table public.events (
  id bigserial primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  work_id uuid references public.works (id) on delete set null,
  type public.event_type not null,
  contact_type text,
  -- sha256(ip + user_agent + daily salt); no IP is ever stored (GDPR, spec section 4).
  visitor_hash text not null,
  referrer_host text,
  country char(2),
  device public.device_type,
  created_at timestamptz not null default now()
);

create index events_profile_created_idx on public.events (profile_id, created_at desc);
create index events_work_created_idx on public.events (work_id, created_at desc) where work_id is not null;

alter table public.events enable row level security;

-- Inserts happen only via /api/events using the service-role client so the
-- visitor_hash derivation and owner-view exclusion (spec section 4) can't be
-- forged by a direct client-side insert.

create policy "owners read their own analytics"
  on public.events for select
  using (profile_id = auth.uid() or public.is_admin());
