-- 3DOT clients and projects. Run after 0001_3dot_core.sql.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  contact_name text,
  email text,
  phone text,
  status text not null default 'active' check (status in ('lead', 'active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null check (char_length(name) between 2 and 160),
  location text,
  status text not null default 'planning' check (status in ('planning', 'in_progress', 'on_hold', 'completed')),
  contract_value numeric(14,2) not null default 0 check (contract_value >= 0),
  created_at timestamptz not null default now()
);

create index if not exists clients_company_id_idx on public.clients(company_id);
create index if not exists projects_company_id_idx on public.projects(company_id);
create index if not exists projects_client_id_idx on public.projects(client_id);

alter table public.clients enable row level security;
alter table public.projects enable row level security;
revoke all on table public.clients, public.projects from anon, authenticated;
grant select, insert, update, delete on table public.clients, public.projects to authenticated;

create policy "Owners manage their clients" on public.clients for all to authenticated
using (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())))
with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())));

create policy "Owners manage their projects" on public.projects for all to authenticated
using (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())))
with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())));
