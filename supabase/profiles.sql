-- =====================================================
-- APHOTECH SOLAR SOLUTION
-- CUSTOMER PROFILES / USER DATA
-- Run this once in Supabase SQL Editor.
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  state text,
  email text,
  privacy_consent boolean not null default false,
  privacy_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Customers can read only their own profile.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);


-- Customers may create only their own profile.
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- Customers can update only their own profile.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Automatically create a profile whenever a new Auth user registers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, phone, state, email,
    privacy_consent, privacy_consent_at
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'state',
    new.email,
    coalesce((new.raw_user_meta_data ->> 'privacy_consent')::boolean, false),
    case
      when new.raw_user_meta_data ->> 'privacy_consent_at' is not null
      then (new.raw_user_meta_data ->> 'privacy_consent_at')::timestamptz
      else null
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Keep updated_at current when a profile changes.
create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_profile_updated_at();

-- Optional: backfill profiles for users who already registered before this table was created.
insert into public.profiles (id, full_name, phone, state, email, privacy_consent, privacy_consent_at, created_at)
select
  id,
  raw_user_meta_data ->> 'full_name',
  raw_user_meta_data ->> 'phone',
  raw_user_meta_data ->> 'state',
  email,
  coalesce((raw_user_meta_data ->> 'privacy_consent')::boolean, false),
  case
    when raw_user_meta_data ->> 'privacy_consent_at' is not null
    then (raw_user_meta_data ->> 'privacy_consent_at')::timestamptz
    else null
  end,
  created_at
from auth.users
on conflict (id) do nothing;
