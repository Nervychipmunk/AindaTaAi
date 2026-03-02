-- Add notification queue and triggers for push notifications
create table if not exists notification_queue (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  title text not null,
  body text not null,
  data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sent_at timestamp with time zone,
  error text
);

create index if not exists notification_queue_user_idx on notification_queue(user_id);
create index if not exists notification_queue_pending_idx on notification_queue(sent_at) where sent_at is null;

create or replace function public.enqueue_checkin_notification()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into notification_queue (user_id, title, body, data)
    values (
      new.connected_id,
      'Check-in solicitado',
      'Seu hub pediu um check-in.',
      jsonb_build_object('type', 'checkin_request', 'request_id', new.id, 'hub_id', new.hub_id)
    );
    return new;
  end if;

  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    if (new.status = 'confirmed') then
      insert into notification_queue (user_id, title, body, data)
      values (
        new.hub_id,
        'Check-in confirmado',
        'Seu conectado confirmou que esta bem.',
        jsonb_build_object('type', 'checkin_confirmed', 'request_id', new.id, 'connected_id', new.connected_id)
      );
    elsif (new.status = 'overdue') then
      insert into notification_queue (user_id, title, body, data)
      values (
        new.hub_id,
        'Check-in atrasado',
        'Seu conectado nao respondeu a tempo.',
        jsonb_build_object('type', 'checkin_overdue', 'request_id', new.id, 'connected_id', new.connected_id)
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists checkin_request_notify_insert on checkin_requests;
create trigger checkin_request_notify_insert
  after insert on checkin_requests
  for each row execute procedure public.enqueue_checkin_notification();

drop trigger if exists checkin_request_notify_update on checkin_requests;
create trigger checkin_request_notify_update
  after update on checkin_requests
  for each row execute procedure public.enqueue_checkin_notification();
