-- Creates a blank `profiles` row the moment a new auth user is created, so
-- the app can always assume `profiles.id = auth.uid()` exists once signed in.
-- Username stays null until onboarding assigns one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, email_verified, ui_locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email_confirmed_at is not null,
    coalesce(new.raw_user_meta_data ->> 'locale', 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keeps profiles.email_verified in sync after email confirmation completes.
create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles set email_verified = true where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_confirmed
  after update on auth.users
  for each row execute function public.handle_user_email_confirmed();
