-- Add user_id column to existing entries table when upgrading from an older schema
alter table if exists entries
  add column if not exists user_id uuid references auth.users(id);

create index if not exists idx_entries_user_created_at on entries(user_id, created_at desc);
