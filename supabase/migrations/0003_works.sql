create type public.source_type as enum (
  'website', 'figma', 'github', 'youtube', 'vimeo', 'loom',
  'google_doc', 'google_slides', 'notion', 'telegram_post',
  'behance', 'dribbble', 'upload_image', 'upload_video', 'upload_pdf', 'other'
);

create type public.render_mode as enum (
  'live_iframe', 'embed', 'github_card', 'screenshot', 'video', 'pdf', 'gallery'
);

create type public.cover_source as enum ('custom', 'og', 'screenshot');
create type public.ingest_status as enum ('pending', 'processing', 'ready', 'failed');
create type public.safety_status as enum ('pending', 'safe', 'unsafe');
create type public.moderation_status as enum ('pending', 'approved', 'flagged', 'rejected');

create table public.works (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  position integer not null default 0,
  source_url text,
  source_type public.source_type not null default 'other',
  render_mode public.render_mode not null default 'screenshot',
  embed_url text,
  title text check (char_length(title) <= 100),
  description text check (char_length(description) <= 1000),
  result text check (char_length(result) <= 200),
  category text,
  tags text[] not null default '{}',
  cover_url text,
  cover_source public.cover_source,
  screenshot_url text,
  meta jsonb not null default '{}'::jsonb,
  iframe_allowed boolean not null default false,
  ingest_status public.ingest_status not null default 'pending',
  safety_status public.safety_status not null default 'pending',
  moderation_status public.moderation_status not null default 'pending',
  is_broken boolean not null default false,
  last_checked_at timestamptz,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tags_max_10 check (array_length(tags, 1) is null or array_length(tags, 1) <= 10),
  constraint works_profile_slug_unique unique (profile_id, slug)
);

create index works_profile_id_idx on public.works (profile_id, position);
create index works_ingest_status_idx on public.works (ingest_status) where ingest_status in ('pending', 'processing');

create trigger works_set_updated_at
  before update on public.works
  for each row execute function public.set_updated_at();

alter table public.works enable row level security;

create policy "works are publicly readable when visible and safe"
  on public.works for select
  using (
    (
      is_hidden = false
      and safety_status = 'safe'
      and moderation_status in ('approved', 'pending')
      and exists (
        select 1 from public.profiles p
        where p.id = works.profile_id and p.status = 'active'
      )
    )
    or profile_id = auth.uid()
    or public.is_admin()
  );

create policy "owners manage their own works"
  on public.works for all
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- catalog_visible is computed on read (needs a >=3 "ready" works count that
-- can't live in a generated column), see spec section 8.2; exposed here as
-- a convenience view for the catalog. Lives here (not in 0002_profiles.sql)
-- because views are validated against real tables at creation time, and
-- this one depends on `works`, created just above.
create view public.catalog_profiles as
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
