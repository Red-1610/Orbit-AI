create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  tool_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New Task Session',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text,
  tool_invocations jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  sku text primary key,
  name text not null,
  stock integer not null default 0,
  location text,
  weight_kg double precision not null default 0.1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  recipient text not null,
  subject text not null,
  body text not null,
  status text not null default 'sent',
  sent_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.products enable row level security;
alter table public.notifications_log enable row level security;

create index if not exists idx_tasks_user_created_at on public.tasks (user_id, created_at desc);
create index if not exists idx_sessions_user_created_at on public.sessions (user_id, created_at desc);
create index if not exists idx_messages_session_created_at on public.messages (session_id, created_at asc);
create index if not exists idx_products_sku on public.products (sku);
create index if not exists idx_notifications_user_sent_at on public.notifications_log (user_id, sent_at desc);

drop policy if exists "Users can view and update own profile" on public.profiles;
create policy "Users can view and update own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can manage own tasks" on public.tasks;
create policy "Users can manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own sessions" on public.sessions;
create policy "Users can manage own sessions"
  on public.sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage messages in their sessions" on public.messages;
create policy "Users can manage messages in their sessions"
  on public.messages for all
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
        and sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
        and sessions.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated users can read products" on public.products;
create policy "Authenticated users can read products"
  on public.products for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can create notifications" on public.notifications_log;
create policy "Authenticated users can create notifications"
  on public.notifications_log for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can read their own notifications" on public.notifications_log;
create policy "Users can read their own notifications"
  on public.notifications_log for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications_log;
create policy "Users can update their own notifications"
  on public.notifications_log for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notifications" on public.notifications_log;
create policy "Users can delete their own notifications"
  on public.notifications_log for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
