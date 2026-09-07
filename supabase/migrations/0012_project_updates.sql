create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  update_date date not null default current_date,
  title text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists project_updates_project_date_idx on public.project_updates(project_id, update_date desc);
alter table public.project_updates enable row level security;
revoke all on public.project_updates from anon;
grant select, insert, update, delete on public.project_updates to authenticated;
drop policy if exists "Owners manage project updates" on public.project_updates;
create policy "Owners manage project updates"
on public.project_updates for all to authenticated
using (exists(select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())))
with check (exists(select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())));
