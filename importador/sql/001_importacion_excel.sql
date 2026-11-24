-- Migración para el importador de Excel.
-- Ejecutar una sola vez en Supabase: SQL Editor -> New query -> pegar -> Run.

-- 1) Origen del movimiento ('app' o 'excel') y huella para evitar duplicados al reimportar.
alter table logs add column if not exists source text not null default 'app';
alter table logs add column if not exists import_hash text;
create unique index if not exists logs_import_hash_key on logs (import_hash);

-- 2) El SKU identifica al producto: no puede repetirse.
--    Si este paso falla, hay SKUs duplicados. Revísalos con:
--    select sku, count(*) from products group by sku having count(*) > 1;
create unique index if not exists products_sku_key on products (sku);

-- 3) RF-13: la existencia nunca puede quedar negativa, tampoco desde la base de datos.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_stock_no_negativo') then
    alter table products add constraint products_stock_no_negativo check (stock >= 0) not valid;
  end if;
end $$;
