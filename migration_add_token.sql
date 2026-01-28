-- Add push_token column to profiles
alter table profiles 
add column if not exists push_token text;

-- Add checking status column to connections if needed for easier querying, 
-- but we are resolving it via checkin_requests for now.
