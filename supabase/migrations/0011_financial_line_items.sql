create table if not exists public.financial_line_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quotation_id uuid references public.quotations(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  vat_percent numeric(5,2) not null default 5 check (vat_percent between 0 and 100),
  created_at timestamptz not null default now(),
  check (
    (quotation_id is not null and invoice_id is null)
    or (quotation_id is null and invoice_id is not null)
  )
);

alter table public.financial_line_items enable row level security;
revoke all on public.financial_line_items from anon;
grant select, insert, update, delete on public.financial_line_items to authenticated;
drop policy if exists "Owners manage financial line items" on public.financial_line_items;
create policy "Owners manage financial line items"
on public.financial_line_items for all to authenticated
using (exists(select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())))
with check (exists(select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())));
