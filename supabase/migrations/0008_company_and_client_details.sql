alter table public.companies add column if not exists email text;
alter table public.companies add column if not exists phone text;
alter table public.companies add column if not exists address text;
alter table public.companies add column if not exists website text;
alter table public.companies add column if not exists signature_url text;
alter table public.companies add column if not exists stamp_url text;

alter table public.clients add column if not exists trn text;
alter table public.clients add column if not exists address text;
alter table public.clients add column if not exists website text;
