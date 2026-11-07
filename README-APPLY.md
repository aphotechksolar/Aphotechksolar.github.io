# Aphotech Solar website update pack

This pack is prepared from the current public GitHub repository contents. It is **not deployed** and it does not change your live website automatically.

## Files

1. `index.html` — fixes the mismatched closing `</section>` near the homepage footer, improves semantic navigation and adds safe `rel` attributes to external new-tab links. Existing package prices and business contact details are retained.
2. `assets/css/mobile.css` — replacement mobile stylesheet. It retains the existing general mobile rules and adds mobile marketplace layout improvements, including horizontal nav scrolling and badge/heart layering so package badges are less likely to be hidden.
3. `supabase/security-hardening.sql` — SQL migration to stop ordinary authenticated customers from updating `profiles.role`, while allowing edits to their own contact fields. It also removes customers' ability to edit quote requests after submission; admin policies remain in place.

## Apply carefully

### A. Back up first
Download a ZIP of your current GitHub repository before replacing files.

### B. Replace website files
In GitHub, open the repository and replace:
- `index.html`
- `assets/css/mobile.css`

Keep the file paths exactly as shown. Do not delete other CSS or JavaScript files.

### C. Apply database security
1. Open your Supabase project.
2. Open SQL Editor and create a new query.
3. Paste the full contents of `supabase/security-hardening.sql`.
4. Run it.
5. Check the verification result: `authenticated_can_update_role` should be `false`; `authenticated_can_update_phone` should be `true`.

This SQL assumes `profiles.sql`, `quote_requests.sql`, and `admin-upgrade.sql` have already been run, matching the current repository's setup. If any of those tables/policies are missing, stop and do not run the script until the database setup is checked.

## Test after applying
- Homepage opens and footer appears normally.
- Packages page still loads and the package badges remain visible on a phone.
- Customer can sign in and submit a quote.
- Customer can view their own quote history.
- Customer cannot update their own role, quote status, quoted amount or admin notes.
- Admin can still review and update quote requests.

## Important limitations
- I could inspect the repository files but could not push commits because GitHub rejected branch creation with a 403 permission error.
- I have not connected to or executed SQL against your Supabase project.
- The CSS is a general mobile improvement based on the current selectors; it still needs visual testing on the live site and on your phone.
