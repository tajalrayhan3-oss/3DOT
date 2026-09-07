alter table public.projects
  add column if not exists location text,
  add column if not exists contract_value numeric(14, 2) not null default 0;

update public.projects
set location = site_address
where location is null and site_address is not null;

alter table public.projects drop constraint if exists projects_contract_value_check;
alter table public.projects
  add constraint projects_contract_value_check check (contract_value >= 0);

alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects
  add constraint projects_status_check
  check (status in ('draft', 'active', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'));

notify pgrst, 'reload schema';
