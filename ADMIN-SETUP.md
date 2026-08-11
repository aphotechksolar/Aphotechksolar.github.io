# Aphotech Solar Admin Setup

## 1. Run the SQL
In Supabase SQL Editor, run these files in this order:

1. `supabase/profiles.sql` (if not already done)
2. `supabase/quote_requests.sql` (if not already done)
3. `supabase/admin-upgrade.sql`

## 2. Make the owner accounts administrators
Run `supabase/make-admin.sql` in the Supabase SQL Editor.

It sets these registered owner accounts to `admin`:

- `oloyedeafo1997@gmail.com`
- `aphotechsolar@gmail.com`

The script also returns both rows so you can confirm that their role is `admin`.

## 3. Admin page
Open:

`admin.html`

Only accounts whose `profiles.role` is `admin` can access it. Database RLS also protects quote requests and product prices, so hiding the page is not the only security control.

## 4. What the admin can do
- View all customer quote requests
- Open customer details
- Change request status
- Add quoted amount
- Add internal admin notes
- Edit package/appliance prices
- Turn products on/off
- Add new products
- Delete products
- Admin Dashboard link appears automatically in My Account for admin users

The public Packages page reads active products from Supabase, so price changes appear there after refresh/deployment-independent database update.
