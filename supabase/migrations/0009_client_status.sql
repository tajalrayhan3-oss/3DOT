alter table public.clients
  add column if not exists status text not null default 'lead';
