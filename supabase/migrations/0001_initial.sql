-- TIRTAWANA cloud save schema (Supabase/PostgreSQL)
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  player_name text not null default 'Traveler',
  created_at timestamptz not null default now()
);

create table if not exists saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  slot_id text not null default 'auto',
  revision_id text not null,
  updated_at timestamptz not null default now(),
  data jsonb not null,
  unique(user_id, slot_id)
);

create index if not exists saves_user_idx on saves(user_id);

-- Sync log for debugging/audit
create table if not exists sync_log (
  id bigserial primary key,
  user_id uuid,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- RLS: users can only touch their own rows
alter table profiles enable row level security;
alter table saves enable row level security;
alter table sync_log enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own saves" on saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own log" on sync_log
  for insert with check (auth.uid() = user_id);
