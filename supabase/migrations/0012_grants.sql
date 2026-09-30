-- Explicit table/sequence/function grants for the API roles.
--
-- Supabase projects normally get these by default, but they don't always
-- carry over when the schema is created by pasting a plain SQL script into
-- the SQL Editor instead of going through the Supabase-managed migration
-- flow. Without them, every request fails with "permission denied for
-- table ..." *before* RLS is even evaluated — RLS still does the real
-- per-row access control on top of this, so granting broad table access
-- here is exactly what a normal Supabase project already does by default.
grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
