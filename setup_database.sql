-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role text check (role in ('hub', 'connected')),
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
  status text check (status in ('pending', 'active')) default 'active', -- Simplificado para MVP
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(hub_id, connected_id)
);

alter table connections enable row level security;

create policy "Users can view connections they are part of" on connections
  for select using (auth.uid() = hub_id or auth.uid() = connected_id);

create policy "Hubs can create connections" on connections
  for insert with check (auth.uid() = hub_id);

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
