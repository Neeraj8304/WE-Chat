-- Arattai chat schema
-- Run this in Supabase SQL Editor before using the app.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null check (char_length(trim(name)) between 1 and 120),
  location text not null default '' check (char_length(location) <= 160),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_sender_receiver_different check (sender_id <> receiver_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_ids uuid[] not null check (cardinality(user_ids) = 2),
  last_message text,
  updated_at timestamptz not null default now()
);

create unique index if not exists conversations_pair_idx
  on public.conversations (least(user_ids[1], user_ids[2]), greatest(user_ids[1], user_ids[2]));
create index if not exists messages_thread_idx
  on public.messages (sender_id, receiver_id, created_at);
create index if not exists conversations_user_ids_idx
  on public.conversations using gin (user_ids);

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.conversations enable row level security;

drop policy if exists "Profiles are visible to signed-in people" on public.profiles;
create policy "Profiles are visible to signed-in people"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "People can create their own profile" on public.profiles;
create policy "People can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "People can update their own profile" on public.profiles;
create policy "People can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "People can read their own messages" on public.messages;
create policy "People can read their own messages"
  on public.messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "People can send their own messages" on public.messages;
create policy "People can send their own messages"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

drop policy if exists "Recipients can mark messages read" on public.messages;
create policy "Recipients can mark messages read"
  on public.messages for update
  to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

drop policy if exists "People can read their conversations" on public.conversations;
create policy "People can read their conversations"
  on public.conversations for select
  to authenticated
  using (auth.uid() = any(user_ids));

drop policy if exists "People can create their conversations" on public.conversations;
create policy "People can create their conversations"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = any(user_ids));

drop policy if exists "People can update their conversations" on public.conversations;
create policy "People can update their conversations"
  on public.conversations for update
  to authenticated
  using (auth.uid() = any(user_ids))
  with check (auth.uid() = any(user_ids));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end
$$;
