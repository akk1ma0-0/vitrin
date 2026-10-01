-- `select p.*` views freeze their column list at creation time (same
-- gotcha as 0013_catalog_search.sql's search_vector fix) — re-running the
-- same definition picks up profiles.telegram_id (0015_telegram_auth.sql),
-- which the view was missing until now.
create or replace view public.catalog_profiles
with (security_invoker = true)
as
select p.*
from public.profiles p
where p.status = 'active'
  and p.email_verified = true
  and p.avatar_url is not null
  and p.headline is not null
  and (
    select count(*) from public.works w
    where w.profile_id = p.id
      and w.is_hidden = false
      and w.safety_status = 'safe'
      and w.moderation_status <> 'rejected'
      and w.ingest_status = 'ready'
  ) >= 3;
