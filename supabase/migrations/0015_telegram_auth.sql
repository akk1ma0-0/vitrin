-- Telegram Login Widget support: maps a Telegram account to its Supabase
-- user without needing a real email address for that user (see
-- /api/auth/telegram, which looks a row up by telegram_id before falling
-- back to creating a new auth user).
alter table public.profiles
  add column telegram_id bigint unique;
