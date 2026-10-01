-- Full-text + trigram search for the catalog (spec section 5.8), replacing
-- the plain ILIKE search in getCatalogProfiles(). `simple` config (no
-- stemming) is used deliberately instead of `english`: freelancers and
-- visitors write in any of the 10 interface languages, and English-specific
-- stemming would silently mis-rank or miss non-English text.

-- Postgres's own to_tsvector(regconfig, text) is STABLE, not IMMUTABLE (a
-- text search config is itself a mutable catalog object), so it can't be
-- used directly in a generated column. This wrapper pins it to 'simple' and
-- promises immutability ourselves — standard, well-known workaround for
-- this exact limitation.
create or replace function public.immutable_simple_tsvector(input text)
returns tsvector
language sql
immutable
set search_path = public
as $$
  select to_tsvector('simple', coalesce(input, ''));
$$;

alter table public.profiles
  add column search_vector tsvector
  generated always as (
    setweight(public.immutable_simple_tsvector(username::text), 'A') ||
    setweight(public.immutable_simple_tsvector(display_name), 'A') ||
    setweight(public.immutable_simple_tsvector(headline), 'B') ||
    setweight(public.immutable_simple_tsvector(array_to_string(skills, ' ')), 'C')
  ) stored;

create index profiles_search_vector_idx on public.profiles using gin (search_vector);

-- Trigram indexes power the `%` similarity operator below, which catches
-- typos/partial words that tsvector's token matching alone would miss
-- (e.g. "dzevyati" still finding "dzevyatyi").
create index profiles_username_trgm_idx
  on public.profiles using gin ((username::text) extensions.gin_trgm_ops);
create index profiles_display_name_trgm_idx
  on public.profiles using gin (display_name extensions.gin_trgm_ops);

-- Does the catalog's filtering (specialization, open-to-work), text search,
-- and sorting in one query, server-side — composing all of that through
-- PostgREST's filter DSL from the client isn't practical once full-text
-- ranking is involved. Returns the full matching set unpaginated; the
-- caller (getCatalogProfiles() in src/lib/profiles.ts) slices the page it
-- needs in JS, which is fine at the row counts a freelancer directory
-- actually has. `security invoker` + querying the `catalog_profiles` view
-- (not the `profiles` table directly) means this still only ever returns
-- rows that view's own visibility rule (spec 8.2) already allows.
create or replace function public.search_catalog_profiles(
  search_query text,
  filter_specialization text default null,
  available_only boolean default false,
  sort_newest boolean default false
)
returns setof public.catalog_profiles
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
begin
  if sort_newest then
    return query
      select cp.*
      from public.catalog_profiles cp
      where
        (filter_specialization is null or cp.specialization = filter_specialization)
        and (not available_only or cp.available_for_work)
        and (
          cp.search_vector @@ websearch_to_tsquery('simple', search_query)
          or cp.username % search_query
          or coalesce(cp.display_name, '') % search_query
        )
      order by cp.created_at desc;
  else
    return query
      select cp.*
      from public.catalog_profiles cp
      where
        (filter_specialization is null or cp.specialization = filter_specialization)
        and (not available_only or cp.available_for_work)
        and (
          cp.search_vector @@ websearch_to_tsquery('simple', search_query)
          or cp.username % search_query
          or coalesce(cp.display_name, '') % search_query
        )
      order by
        (cp.plan = 'pro') desc,
        ts_rank(cp.search_vector, websearch_to_tsquery('simple', search_query)) desc,
        greatest(
          similarity(cp.username::text, search_query),
          similarity(coalesce(cp.display_name, ''), search_query)
        ) desc,
        cp.created_at desc;
  end if;
end;
$$;

-- Function EXECUTE grants are deny-by-default (see 0012_grants.sql).
-- immutable_simple_tsvector is only ever called from the generated column
-- above, never directly, so it gets no grant (stays unreachable via RPC).
-- search_catalog_profiles needs anon/authenticated explicitly — catalog
-- search is a public, unauthenticated feature.
grant execute on function public.search_catalog_profiles(text, text, boolean, boolean) to anon, authenticated;
