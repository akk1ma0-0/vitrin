create table public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  target_type text not null,
  target_id uuid not null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

create index moderation_log_target_idx on public.moderation_log (target_type, target_id);

alter table public.moderation_log enable row level security;

create policy "admins read moderation log"
  on public.moderation_log for select
  using (public.is_admin());

-- Writes happen only via service-role code paths (admin actions, automated moderation).
