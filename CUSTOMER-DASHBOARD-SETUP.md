# Aphotech Solar Customer Dashboard v3

This upgrade adds:
- Customer dashboard
- Own profile display
- Quote request history
- Quote request status
- Logged-in quote submission saved in Supabase
- Row Level Security so customers can only read their own requests

## One required Supabase step

Open Supabase -> SQL Editor and run the complete file:

`supabase/quote_requests.sql`

Run it once.

After it succeeds:
1. Upload this project to GitHub.
2. Open the live site.
3. Log in.
4. Open `Get a Quote`.
5. Submit a test quote.
6. Open `My Account`.
7. The new request should appear under `My Solar Requests`.

## Important

Do not remove the existing `profiles.sql` setup. This upgrade depends on the existing `profiles` table for customer information.

The customer-facing RLS policies intentionally allow each authenticated user to see only rows where `user_id = auth.uid()`.
