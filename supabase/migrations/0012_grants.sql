-- Explicit table/sequence grants for the API roles.
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

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- Functions are handled separately and deliberately *not* broadly granted:
-- Postgres auto-grants EXECUTE to the PUBLIC pseudo-role on function
-- creation (which anon/authenticated inherit, since every role is a member
-- of PUBLIC), so every function in this schema is reachable as a
-- `/rest/v1/rpc/<name>` endpoint unless that's explicitly revoked. Most of
-- our functions are internal triggers (set_updated_at, handle_new_user,
-- protect_privileged_profile_columns, ...) or admin-only (claim_jobs) that
-- must never be callable directly by a visitor or signed-in user.
revoke execute on all functions in schema public from public;
alter default privileges in schema public revoke execute on functions from public;

grant all on all functions in schema public to service_role;
alter default privileges in schema public grant all on functions to service_role;

-- The one exception: is_admin() is evaluated inside RLS policies applied
-- to anon/authenticated queries, so those roles need EXECUTE on it. It's
-- safe to expose directly too — it only returns a boolean derived from the
-- caller's own auth.uid(), nothing sensitive.
grant execute on function public.is_admin() to anon, authenticated;

-- claim_jobs() must only ever run from the service-role cron endpoint.
-- (Already covered by the blanket service_role grant above; called out
-- here so it's never mistaken for something that needs a client-facing grant.)
