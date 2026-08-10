# Aphotech Solar Solution — Supabase

## Registration/authentication

The website registration flow is configured for Supabase Auth.

It collects:
- Full name
- Phone / WhatsApp
- State
- Email
- Password
- Privacy consent

The signup sends these values as Supabase Auth user metadata. The database trigger in
`profiles.sql` automatically creates the matching `public.profiles` record, including
when email confirmation is enabled.

### Supabase setup

The `supabase/profiles.sql` migration should be run once in:
**Supabase Dashboard -> SQL Editor**

Do not put a `service_role` key in the website.

### Important

The website uses the publishable/anon Supabase key. Keep the database RLS policies
enabled. Customers are allowed to read, insert, and update only their own profile.
