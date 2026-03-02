-- Add daily schedule support and fix connection policies
alter table connections
  add column if not exists daily_checkin_time time;

alter table connections
  alter column status set default 'pending';

drop policy if exists "Users can update connections they are part of" on connections;
create policy "Users can update connections they are part of" on connections
  for update using (auth.uid() = hub_id or auth.uid() = connected_id);

drop policy if exists "Users can delete connections they are part of" on connections;
create policy "Users can delete connections they are part of" on connections
  for delete using (auth.uid() = hub_id or auth.uid() = connected_id);

drop policy if exists "Connected users can update their requests" on checkin_requests;
create policy "Connected users can update their requests" on checkin_requests
  for update using (auth.uid() = connected_id);

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
