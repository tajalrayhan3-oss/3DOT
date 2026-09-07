create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  file_size bigint not null default 0 check (file_size >= 0 and file_size <= 10485760),
  created_at timestamptz not null default now()
);

create index if not exists project_files_project_created_idx on public.project_files(project_id, created_at desc);
alter table public.project_files enable row level security;
revoke all on public.project_files from anon;
grant select, insert, update, delete on public.project_files to authenticated;
drop policy if exists "Owners manage project files" on public.project_files;
create policy "Owners manage project files"
on public.project_files for all to authenticated
using (exists(select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())))
with check (exists(select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists "Company owners manage project files" on storage.objects;
create policy "Company owners manage project files"
on storage.objects for all to authenticated
using (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid()::text));
