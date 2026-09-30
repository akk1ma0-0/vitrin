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

-- is_admin() lives in 0002_profiles.sql, right after the profiles table is
-- created: it's a `language sql` function, which Postgres validates against
-- real tables at CREATE FUNCTION time (unlike plpgsql), so it can't be
-- defined here before `profiles` exists.
