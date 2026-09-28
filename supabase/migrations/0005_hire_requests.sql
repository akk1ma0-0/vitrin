create type public.hire_request_status as enum ('new', 'read', 'archived', 'spam');

create table public.hire_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  work_id uuid references public.works (id) on delete set null,
  name text not null check (char_length(name) <= 100),
  email text not null,
  budget text check (char_length(budget) <= 100),
  message text not null check (char_length(message) <= 2000),
  locale text not null default 'en',
  status public.hire_request_status not null default 'new',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hire_requests_profile_id_idx on public.hire_requests (profile_id, created_at desc);

create trigger hire_requests_set_updated_at
  before update on public.hire_requests
  for each row execute function public.set_updated_at();

alter table public.hire_requests enable row level security;

-- Inserts only happen from the /api/hire route handler using the service-role
-- client, after Turnstile + rate limiting + moderation have already run, so
-- there is deliberately no public insert policy here.

create policy "owners read their own hire requests"
  on public.hire_requests for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "owners update status of their own hire requests"
  on public.hire_requests for update
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());
