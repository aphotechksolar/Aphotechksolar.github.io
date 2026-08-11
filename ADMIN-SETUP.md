# Aphotech Solar Admin Setup

## 1. Run the SQL
In Supabase SQL Editor, run these files in this order:

1. `supabase/profiles.sql` (if not already done)
2. `supabase/quote_requests.sql` (if not already done)
3. `supabase/admin-upgrade.sql`

## 2. Make your account an administrator
After signing in to the website with your owner/admin email, run this in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR-ADMIN-EMAIL@example.com';
```

Replace the example email with the email you actually use for the Aphotech admin account.

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

The public Packages page reads active products from Supabase, so price changes appear there after refresh/deployment-independent database update.
