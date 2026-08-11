-- APHOTECH SOLAR: MAKE OWNER ACCOUNTS ADMINS
-- Run admin-upgrade.sql first.
-- This is safe to run more than once.

update public.profiles
set role = 'admin',
    updated_at = now()
where lower(email) in (
  'oloyedeafo1997@gmail.com',
  'aphotechsolar@gmail.com'
);

-- Verify the two accounts:
select id, email, role
from public.profiles
where lower(email) in (
  'oloyedeafo1997@gmail.com',
  'aphotechsolar@gmail.com'
)
order by email;
