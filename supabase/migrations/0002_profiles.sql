create type public.rate_unit as enum ('hour', 'project');
create type public.theme_pref as enum ('light', 'dark', 'system');
create type public.plan_type as enum ('free', 'pro');
create type public.user_role as enum ('user', 'admin');
create type public.profile_status as enum ('active', 'hidden', 'banned');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext unique,
  display_name text,
  headline text check (char_length(headline) <= 80),
  bio text check (char_length(bio) <= 600),
  avatar_url text,
  specialization text,
  skills text[] not null default '{}',
  work_languages text[] not null default '{}',
  country char(2),
  rate_min integer check (rate_min is null or rate_min >= 0),
  rate_max integer check (rate_max is null or rate_max >= 0),
  rate_currency char(3) not null default 'USD',
  rate_unit public.rate_unit,
  available_for_work boolean not null default true,
  contacts jsonb not null default '{}'::jsonb,
  theme public.theme_pref not null default 'system',
  accent_color text not null default '#FF6B00',
  ui_locale text not null default 'en',
  plan public.plan_type not null default 'free',
  role public.user_role not null default 'user',
  status public.profile_status not null default 'active',
  email_verified boolean not null default false,
  username_changed_at timestamptz,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint skills_max_20 check (array_length(skills, 1) is null or array_length(skills, 1) <= 20),
  constraint username_format check (
    username is null or username ~ '^[a-z][a-z0-9_-]{2,29}$'
  )
);

comment on column public.profiles.plan is 'Cached from subscriptions; source of truth is Paddle via the webhook handler.';

create index profiles_username_idx on public.profiles (username);
create index profiles_specialization_idx on public.profiles (specialization) where status = 'active';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Returns true when the current JWT belongs to an admin. Used inside RLS
-- policies instead of duplicating the profiles lookup everywhere. Defined
-- here (not in 0001) because `language sql` functions are validated against
-- real tables at CREATE FUNCTION time, and `profiles` has to exist first.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- The `catalog_profiles` view (spec section 8.2) lives in 0003_works.sql,
-- right after the `works` table it also depends on is created.

alter table public.profiles enable row level security;

create policy "profiles are publicly readable when active"
  on public.profiles for select
  using (status = 'active' or id = auth.uid() or public.is_admin());

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "users can update their own profile"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Belt-and-suspenders on top of the policy above: even an admin-crafted
-- request can't smuggle a plan/role change through the profile-edit form,
-- only genuine service-role code (webhooks, admin RPCs) can.
create or replace function public.protect_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.plan is distinct from old.plan then
    new.plan := old.plan;
  end if;
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  if new.status is distinct from old.status and not public.is_admin() then
    new.status := old.status;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_privileged_profile_columns();
