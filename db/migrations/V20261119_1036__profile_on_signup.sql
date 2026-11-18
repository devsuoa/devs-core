-- Production's trigger that gives every new login a profile row. The baseline missed it
-- because it lives on auth.users, outside the dumped public schema.
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
