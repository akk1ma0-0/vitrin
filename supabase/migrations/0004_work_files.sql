create type public.file_kind as enum ('image', 'video', 'pdf');

create table public.work_files (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works (id) on delete cascade,
  storage_path text not null,
  mime text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  kind public.file_kind not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index work_files_work_id_idx on public.work_files (work_id, position);

create trigger work_files_set_updated_at
  before update on public.work_files
  for each row execute function public.set_updated_at();

alter table public.work_files enable row level security;

create policy "work files follow the parent work's visibility"
  on public.work_files for select
  using (
    exists (
      select 1 from public.works w
      join public.profiles p on p.id = w.profile_id
      where w.id = work_files.work_id
        and (
          (
            w.is_hidden = false
            and w.safety_status = 'safe'
            and w.moderation_status in ('approved', 'pending')
            and p.status = 'active'
          )
          or w.profile_id = auth.uid()
        )
    )
    or public.is_admin()
  );

create policy "owners manage files on their own works"
  on public.work_files for all
  using (
    exists (select 1 from public.works w where w.id = work_files.work_id and w.profile_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.works w where w.id = work_files.work_id and w.profile_id = auth.uid())
    or public.is_admin()
  );
