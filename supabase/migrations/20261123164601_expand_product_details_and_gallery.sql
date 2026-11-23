-- Adds customer-facing product details and photo gallery fields.
-- Safe to apply repeatedly because every column uses IF NOT EXISTS.
alter table public.products
  add column if not exists long_description text,
  add column if not exists specifications jsonb not null default '{}'::jsonb,
  add column if not exists components jsonb not null default '[]'::jsonb,
  add column if not exists supported_appliances jsonb not null default '[]'::jsonb,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists warranty text,
  add column if not exists installation text,
  add column if not exists stock_status text not null default 'Available';
