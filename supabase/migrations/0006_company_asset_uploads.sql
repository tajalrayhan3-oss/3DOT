alter table public.companies add column if not exists letterhead_url text;

insert into storage.buckets (id, name, public)
values ('company-assets', 'company-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Company owners manage company assets" on storage.objects;
create policy "Company owners manage company assets"
on storage.objects for all to authenticated
using (bucket_id = 'company-assets' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'company-assets' and (storage.foldername(name))[1] = (select auth.uid()::text));
