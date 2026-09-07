create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  assigned_employee_id uuid references public.employees(id) on delete set null,
  title text not null,
  notes text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists project_tasks_project_status_idx on public.project_tasks(project_id, status, due_date);
alter table public.project_tasks enable row level security;
revoke all on table public.project_tasks from anon, authenticated;
grant select, insert, update, delete on table public.project_tasks to authenticated;
drop policy if exists "Owners view project tasks" on public.project_tasks;
create policy "Owners view project tasks" on public.project_tasks for select to authenticated using (exists (select 1 from public.companies c where c.id = project_tasks.company_id and c.owner_id = (select auth.uid())));
drop policy if exists "Owners add project tasks" on public.project_tasks;
create policy "Owners add project tasks" on public.project_tasks for insert to authenticated with check (exists (select 1 from public.companies c where c.id = project_tasks.company_id and c.owner_id = (select auth.uid())) and exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.company_id = project_tasks.company_id));
drop policy if exists "Owners update project tasks" on public.project_tasks;
create policy "Owners update project tasks" on public.project_tasks for update to authenticated using (exists (select 1 from public.companies c where c.id = project_tasks.company_id and c.owner_id = (select auth.uid()))) with check (exists (select 1 from public.companies c where c.id = project_tasks.company_id and c.owner_id = (select auth.uid())) and exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.company_id = project_tasks.company_id));
drop policy if exists "Owners delete project tasks" on public.project_tasks;
create policy "Owners delete project tasks" on public.project_tasks for delete to authenticated using (exists (select 1 from public.companies c where c.id = project_tasks.company_id and c.owner_id = (select auth.uid())));
