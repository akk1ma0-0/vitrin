-- Extensions & shared helpers used by every table below.
create extension if not exists "citext" with schema public;
create extension if not exists "pg_trgm" with schema public;
create extension if not exists "pgcrypto" with schema public;

-- Generic updated_at trigger, attached per-table in later migrations.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Returns true when the current JWT belongs to an admin. Used inside RLS
-- policies instead of duplicating the profiles lookup everywhere.
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
