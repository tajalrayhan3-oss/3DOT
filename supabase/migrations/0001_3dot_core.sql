-- 3DOT core: one company workspace per owner. Run in the Supabase SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  trn text,
  city text,
  primary_language text not null default 'en' check (primary_language in ('en', 'ar', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_owner_id_idx on public.companies(owner_id);

alter table public.companies enable row level security;
revoke all on table public.companies from anon, authenticated;
grant select, insert, update, delete on table public.companies to authenticated;

create policy "Owners can read their companies" on public.companies for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners can create companies" on public.companies for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners can update their companies" on public.companies for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners can delete their companies" on public.companies for delete to authenticated using ((select auth.uid()) = owner_id);
