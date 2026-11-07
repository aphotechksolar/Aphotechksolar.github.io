-- APHOTECH SOLAR: CUSTOMER PROFILE / QUOTE SECURITY HARDENING
-- Run this in Supabase SQL Editor after profiles.sql and admin-upgrade.sql.
-- This migration keeps customers able to edit their own contact details,
-- but removes their ability to change the protected role column.
-- It also prevents customers from editing quote status, amount or admin notes.

begin;

alter table public.profiles enable row level security;
alter table public.quote_requests enable row level security;

-- Remove the broad table-level UPDATE privilege. Column-level grants below
-- deliberately omit the protected profiles.role column.
revoke update on table public.profiles from anon, authenticated;
grant update (full_name, phone, state, email, privacy_consent, privacy_consent_at)
  on table public.profiles to authenticated;

-- Keep row ownership enforcement for profile updates.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Customer quote requests are read-only after submission.
-- Admins retain access through the policies created in admin-upgrade.sql.
drop policy if exists "Users can update own quote requests" on public.quote_requests;

commit;

-- Verification: the authenticated role should not have UPDATE privilege
-- on the protected role column, while retaining update access to contact fields.
select
  has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') as authenticated_can_update_role,
  has_column_privilege('authenticated', 'public.profiles', 'phone', 'UPDATE') as authenticated_can_update_phone;
