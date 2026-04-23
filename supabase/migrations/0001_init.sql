-- Optional Supabase migration: simple tracker schema
create extension if not exists pgcrypto;

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  entry_type text not null check (entry_type in ('grocery', 'expense')),
  name text not null,
  category text not null,
  quantity integer not null default 1,
  amount numeric(10,2) not null default 0,
  purchased boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_entries_user_created_at on entries(user_id, created_at desc);
