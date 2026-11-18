-- From here on only the API reads and writes data. The browser's anon key is good for
-- logging in through Supabase Auth and nothing else.
--
-- ORDER MATTERS: apply this only after the website that calls the API is live. Against the
-- old website (which queries tables directly) it breaks every page that loads data.

-- Tables, views and sequences: no direct access for website visitors or logged-in users.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Tables created later start closed too, instead of Supabase's default of open-to-everyone.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- Storage: uploads and downloads for these buckets go through the API, which uses the
-- service role key. Remove every browser-facing policy that mentions them. Public image
-- URLs keep working: they're served from public buckets without any policy.
do $$
declare
  p record;
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ '(event-payments|event-images|''Links'')'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;
