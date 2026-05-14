create extension if not exists "pgcrypto";

create table if not exists public.crawl_history (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  domain text not null default '',
  title text not null default '',
  category text not null default 'Uncategorized',
  status text not null check (status in ('success', 'failed')),
  crawled_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists crawl_history_created_at_idx
  on public.crawl_history (created_at desc);

alter table public.crawl_history enable row level security;

grant select, insert on public.crawl_history to anon, authenticated;

drop policy if exists "Public users can view crawl history" on public.crawl_history;
create policy "Public users can view crawl history"
  on public.crawl_history
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public users can insert crawl history" on public.crawl_history;
create policy "Public users can insert crawl history"
  on public.crawl_history
  for insert
  to anon, authenticated
  with check (true);
