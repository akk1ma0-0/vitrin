-- Extensions & shared helpers used by every table below.
--
-- Extensions live in a dedicated `extensions` schema, not `public`, per
-- Supabase's own linter recommendation (keeps `public`'s namespace clean
-- and avoids the "Extension in Public" security advisory). citext is
-- referenced schema-qualified (`extensions.citext`) wherever it's used as
-- a column type.
create schema if not exists extensions;
create extension if not exists "citext" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- Generic updated_at trigger, attached per-table in later migrations.
-- `set search_path` pins name resolution so it can't be hijacked by a
-- caller-controlled search_path (Supabase's "Function Search Path
-- Mutable" advisory).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
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
