begin;

create table public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record_date date not null,
  category text not null check (category in ('idea', 'book', 'skill', 'exercise', 'news', 'fun_offline', 'fun_phone')),
  tags text[] not null default '{}',
  content text,
  gain text,
  minutes int not null default 0 check (minutes between 0 and 720),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index records_user_date_idx on public.records (user_id, record_date);
alter table public.records enable row level security;
create policy records_owner on public.records for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null check (category in ('book', 'skill', 'exercise')),
  name text not null check (char_length(name) between 1 and 20),
  created_at timestamptz not null default now(),
  unique (user_id, category, name)
);

alter table public.tags enable row level security;
create policy tags_owner on public.tags for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Data API 需要显式授权。公开访问仍无表权限，已登录用户仍受行级规则限制。
revoke all on public.records, public.tags from anon, public;
grant select, insert, update, delete on public.records to authenticated;
grant select, insert, delete on public.tags to authenticated;

commit;
