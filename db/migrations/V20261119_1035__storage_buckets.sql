-- The Storage buckets the site uses, matching production. Skipped where Supabase Storage
-- isn't installed (the plain Postgres in CI and local Docker has no storage schema).
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage.buckets not found, skipping';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit) values
    ('event-images', 'event-images', true, null),
    ('event-payments', 'event-payments', false, 52428800),
    ('Links', 'Links', true, null)
  on conflict (id) do nothing;
end $$;
