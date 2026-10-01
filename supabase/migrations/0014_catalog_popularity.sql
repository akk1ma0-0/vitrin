-- "Popular" catalog sort (spec section 5.8): ranks by profile_view count
-- over the last 30 days. `security definer` is required here (unlike
-- search_catalog_profiles) because `events` has RLS enabled with no public
-- SELECT policy at all — only service-role writes to it via /api/events.
-- Running as definer lets this function read the aggregate COUNT it needs;
-- it never exposes a single raw event row, and the catalog_profiles half of
-- the query still only surfaces what that view's own (non-RLS) WHERE
-- clause already treats as public, same reasoning as is_admin() in
-- 0002_profiles.sql.
create or replace function public.catalog_profiles_by_popularity(
  filter_specialization text default null,
  available_only boolean default false
)
returns setof public.catalog_profiles
language sql
stable
security definer
set search_path = public
as $$
  select cp.*
  from public.catalog_profiles cp
  left join (
    select profile_id, count(*) as views
    from public.events
    where type = 'profile_view' and created_at >= now() - interval '30 days'
    group by profile_id
  ) v on v.profile_id = cp.id
  where
    (filter_specialization is null or cp.specialization = filter_specialization)
    and (not available_only or cp.available_for_work)
  order by coalesce(v.views, 0) desc, cp.created_at desc;
$$;

-- Function EXECUTE grants are deny-by-default (see 0012_grants.sql) —
-- catalog browsing (including "popular" sort) is a public feature.
grant execute on function public.catalog_profiles_by_popularity(text, boolean) to anon, authenticated;
