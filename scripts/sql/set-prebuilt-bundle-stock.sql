-- Prebuilt best-seller allocation: 10 complete units per style
-- Shared parts are summed across styles; substitution fallbacks floored at 10.
-- Requires unique (name, metal) on public.inventory. If upsert fails, add:
--   create unique index if not exists inventory_name_metal_uidx on public.inventory (name, metal);

insert into public.inventory (name, metal, qty_in_stock)
values
  ('American Flag', 'gold', 10),
  ('American Flag', 'silver', 10),
  ('Black Star', 'gold', 10),
  ('Bow - Red with Pearl', 'gold', 10),
  ('Checkered - Pink', 'silver', 10),
  ('Checkered Flag - Gold', 'gold', 10),
  ('Checkered Flag - Silver', 'silver', 10),
  ('Cherries', 'silver', 10),
  ('Cherries - Pink Background', 'gold', 10),
  ('Cherries Dangle', 'gold', 10),
  ('Cherry Dangle', 'silver', 10),
  ('Cherry Heart Checkered', 'gold', 10),
  ('Diet Coke', 'silver', 10),
  ('Diet Coke Can', 'gold', 10),
  ('Double Heart - Red/Pink', 'silver', 10),
  ('Flower - Pink', 'gold', 10),
  ('Flower - Pink', 'silver', 10),
  ('Flower - Red', 'gold', 10),
  ('Flower - Turquoise', 'silver', 10),
  ('Gold Bracelet', 'gold', 20),
  ('Heart - Blue Gem', 'silver', 10),
  ('Heart - Red', 'gold', 10),
  ('Heart - Red and Gold', 'gold', 10),
  ('I Love You', 'silver', 10),
  ('Pearl - Gold', 'gold', 10),
  ('Pearl - White', 'silver', 10),
  ('Raised Gold Heart', 'silver', 10),
  ('Silver Bracelet', 'silver', 20),
  ('Star - Black', 'silver', 10),
  ('Star - Gold', 'silver', 20)
on conflict (name, metal) do update
  set qty_in_stock = excluded.qty_in_stock;
