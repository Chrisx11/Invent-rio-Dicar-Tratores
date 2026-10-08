-- Cole e execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/ztiymllmnylupgyjiqcz/sql/new

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_number text default '',
  category text default '',
  subcategory text default '',
  description text default '',
  brand text default '',
  model text default '',
  part_number text default '',
  asset_number text default '',
  serial_number text default '',
  application text default '',
  unit text default '',
  qty numeric,
  condition text default '',
  location text default '',
  responsible text default '',
  unit_value numeric,
  min_stock numeric,
  max_stock numeric,
  lot text default '',
  expiry date,
  status text default '',
  count_date date,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_categories (
  name text primary key,
  created_at timestamptz default now()
);

alter table public.inventory_items enable row level security;
alter table public.inventory_categories enable row level security;

drop policy if exists "anon_all_inventory_items" on public.inventory_items;
create policy "anon_all_inventory_items"
  on public.inventory_items for all
  to anon, authenticated
  using (true) with check (true);

drop policy if exists "anon_all_inventory_categories" on public.inventory_categories;
create policy "anon_all_inventory_categories"
  on public.inventory_categories for all
  to anon, authenticated
  using (true) with check (true);

grant select, insert, update, delete on public.inventory_items to anon, authenticated;
grant select, insert, update, delete on public.inventory_categories to anon, authenticated;
