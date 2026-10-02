-- profiles.contacts changes from a flat { telegram, email, ... } object (one
-- value per kind) to an ordered list of { type, value } entries, so a
-- freelancer can list several of the same kind (two emails, two phones...).
-- Existing objects are converted in place, email first.
update public.profiles
set contacts = coalesce(
  (
    select jsonb_agg(jsonb_build_object('type', e.key, 'value', e.value) order by (e.key <> 'email'), e.key)
    from jsonb_each_text(contacts) as e
    where btrim(e.value) <> ''
  ),
  '[]'::jsonb
)
where jsonb_typeof(contacts) = 'object';

alter table public.profiles alter column contacts set default '[]'::jsonb;
