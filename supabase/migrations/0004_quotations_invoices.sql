create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null, number text not null,
  title text not null, amount numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected')),
  created_at timestamptz not null default now(), unique(company_id, number)
);
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null, number text not null,
  amount numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  due_date date, created_at timestamptz not null default now(), unique(company_id, number)
);
alter table public.quotations enable row level security;
alter table public.invoices enable row level security;
grant select, insert, update, delete on public.quotations, public.invoices to authenticated;
create policy "Owners manage quotations" on public.quotations for all to authenticated using (exists(select 1 from public.companies c where c.id=company_id and c.owner_id=(select auth.uid()))) with check (exists(select 1 from public.companies c where c.id=company_id and c.owner_id=(select auth.uid())));
create policy "Owners manage invoices" on public.invoices for all to authenticated using (exists(select 1 from public.companies c where c.id=company_id and c.owner_id=(select auth.uid()))) with check (exists(select 1 from public.companies c where c.id=company_id and c.owner_id=(select auth.uid())));
