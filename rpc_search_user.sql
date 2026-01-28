-- Function to allow searching for a user profile by email
-- This is secure because it's a defined function that only returns specific data,
-- instead of opening up the entire profiles table.

create or replace function get_user_by_email(email_input text)
returns table (id uuid, full_name text)
security definer -- Runs with privileges of the creator (admin), bypassing RLS
as $$
begin
  return query
  select p.id, p.full_name
  from auth.users u
  join public.profiles p on u.id = p.id
  where u.email = email_input;
end;
$$ language plpgsql;
