-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role text check (role in ('hub', 'connected')),
  push_token text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- CONNECTIONS (Hub <-> Connected)
create table connections (
  id uuid default uuid_generate_v4() primary key,
  hub_id uuid references profiles(id) not null,
  connected_id uuid references profiles(id) not null,
  status text check (status in ('pending', 'active')) default 'pending', -- Convite pendente por padrao
  daily_checkin_time time, -- Horario diario configurado pelo hub
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(hub_id, connected_id)
);

alter table connections enable row level security;

create policy "Users can view connections they are part of" on connections
  for select using (auth.uid() = hub_id or auth.uid() = connected_id);

create policy "Hubs can create connections" on connections
  for insert with check (auth.uid() = hub_id);

create policy "Users can update connections they are part of" on connections
  for update using (auth.uid() = hub_id or auth.uid() = connected_id);

create policy "Users can delete connections they are part of" on connections
  for delete using (auth.uid() = hub_id or auth.uid() = connected_id);

-- CHECKIN REQUESTS
create table checkin_requests (
  id uuid default uuid_generate_v4() primary key,
  hub_id uuid references profiles(id) not null,
  connected_id uuid references profiles(id) not null,
  due_at timestamp with time zone not null,
  expires_at timestamp with time zone not null,
  status text check (status in ('pending', 'confirmed', 'overdue')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table checkin_requests enable row level security;

create policy "Users can view their requests" on checkin_requests
  for select using (auth.uid() = hub_id or auth.uid() = connected_id);

create policy "System/Hub can create requests" on checkin_requests
  for insert with check (auth.uid() = hub_id); -- MVP: Hub cria ou Backend cria

create policy "Connected users can update their requests" on checkin_requests
  for update using (auth.uid() = connected_id);

-- CHECKIN RESPONSES
create table checkin_responses (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references checkin_requests(id) not null,
  connected_id uuid references profiles(id) not null,
  auth_method text, -- 'biometrics', 'pin', etc
  payload text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table checkin_responses enable row level security;

create policy "Connected users can create responses" on checkin_responses
  for insert with check (auth.uid() = connected_id);

create policy "Hubs can view responses for their requests" on checkin_responses
  for select using (
    exists (
      select 1 from checkin_requests
      where checkin_requests.id = checkin_responses.request_id
      and checkin_requests.hub_id = auth.uid()
    )
    or auth.uid() = connected_id
  );

-- Scheduled daily check-ins (use with a cron/edge scheduler)
create or replace function public.create_daily_checkins()
returns void
language plpgsql
security definer
as $$
declare
  local_now timestamp := (now() at time zone 'America/Sao_Paulo');
begin
  insert into checkin_requests (hub_id, connected_id, due_at, expires_at, status)
  select c.hub_id,
         c.connected_id,
         now(),
         now() + interval '10 minutes',
         'pending'
  from connections c
  where c.status = 'active'
    and c.daily_checkin_time is not null
    and to_char(c.daily_checkin_time, 'HH24:MI') = to_char(local_now, 'HH24:MI')
    and not exists (
      select 1
      from checkin_requests r
      where r.hub_id = c.hub_id
        and r.connected_id = c.connected_id
        and (r.created_at at time zone 'America/Sao_Paulo')::date = local_now::date
    );
end;
$$;

create or replace function public.mark_overdue_checkins()
returns void
language plpgsql
security definer
as $$
begin
  update checkin_requests
  set status = 'overdue'
  where status = 'pending'
    and expires_at < now();
end;
$$;

-- Auto-create profile trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
