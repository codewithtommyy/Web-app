create extension if not exists "pgcrypto";

create table if not exists public.report_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_urls integer not null default 0,
  successful_count integer not null default 0,
  failed_count integer not null default 0,
  categories text[] not null default '{}',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists report_runs_user_id_created_at_idx
  on public.report_runs (user_id, created_at desc);

alter table public.report_runs enable row level security;

drop policy if exists "Users can view their own report runs" on public.report_runs;
create policy "Users can view their own report runs"
  on public.report_runs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own report runs" on public.report_runs;
create policy "Users can insert their own report runs"
  on public.report_runs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own report runs" on public.report_runs;
create policy "Users can delete their own report runs"
  on public.report_runs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
