create table if not exists public.project_expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  expense_date date not null default current_date,
  category text not null check (category in ('material', 'labour', 'equipment', 'transport', 'subcontractor', 'other')),
  description text not null,
  supplier text,
  amount numeric(14, 2) not null check (amount >= 0),
  payment_method text,
  reference text,
  created_at timestamptz not null default now()
);

create index if not exists project_expenses_project_date_idx
  on public.project_expenses(project_id, expense_date desc, created_at desc);

alter table public.project_expenses enable row level security;
revoke all on public.project_expenses from anon, authenticated;
grant select, insert, update, delete on public.project_expenses to authenticated;

drop policy if exists "Owners view project expenses" on public.project_expenses;
create policy "Owners view project expenses"
on public.project_expenses for select to authenticated
using (
  exists (
    select 1 from public.companies c
    where c.id = project_expenses.company_id and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "Owners add project expenses" on public.project_expenses;
create policy "Owners add project expenses"
on public.project_expenses for insert to authenticated
with check (
  exists (
    select 1 from public.companies c
    where c.id = project_expenses.company_id and c.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.projects p
    where p.id = project_expenses.project_id and p.company_id = project_expenses.company_id
  )
);

drop policy if exists "Owners update project expenses" on public.project_expenses;
create policy "Owners update project expenses"
on public.project_expenses for update to authenticated
using (
  exists (
    select 1 from public.companies c
    where c.id = project_expenses.company_id and c.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.companies c
    where c.id = project_expenses.company_id and c.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.projects p
    where p.id = project_expenses.project_id and p.company_id = project_expenses.company_id
  )
);

drop policy if exists "Owners delete project expenses" on public.project_expenses;
create policy "Owners delete project expenses"
on public.project_expenses for delete to authenticated
using (
  exists (
    select 1 from public.companies c
    where c.id = project_expenses.company_id and c.owner_id = (select auth.uid())
  )
);
