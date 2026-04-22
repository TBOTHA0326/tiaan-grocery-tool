-- Supabase migration: grocery list core schema
create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  icon text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  quantity text,
  price numeric(10,2),
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_items_category_position on items(user_id, category_id, position);
