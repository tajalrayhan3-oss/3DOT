create table if not exists public.employee_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(employee_id, project_id)
);

alter table public.employee_assignments enable row level security;
grant select, insert, update, delete on public.employee_assignments to authenticated;
drop policy if exists "Owners manage employee assignments" on public.employee_assignments;
create policy "Owners manage employee assignments" on public.employee_assignments for all to authenticated
using (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())))
with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())));
