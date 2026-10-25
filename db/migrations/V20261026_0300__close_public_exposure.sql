-- Closes the leaks found on 2026-10-26. Safe to apply while the current website still
-- talks to Supabase directly: nothing the site legitimately does depends on these grants.
-- Idempotent, because some of it may already have been run by hand in the SQL editor.

-- 1. Any logged-in account could set its own role to 'admin' and is_superuser to true,
--    because the "update own profile" policy didn't restrict columns.
revoke update on public.profiles from anon, authenticated;
grant update (username) on public.profiles to authenticated;

-- 2. The policy named "Admins can read profiles" was USING (true) for every role,
--    exposing every exec's username, team and superuser flag to the public.
drop policy if exists "Admins can read profiles" on public.profiles;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
                 and policyname = 'admins read profiles') then
    create policy "admins read profiles" on public.profiles
      for select to authenticated using (public.is_admin());
  end if;
end $$;

-- 3. student_major (student IDs with degree and major) was readable by anyone. Its admin
--    policy compared auth.role() to 'admin', which is never true, so replace both.
drop policy if exists "allow read student_major" on public.student_major;
drop policy if exists "admin read student_major" on public.student_major;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'student_major'
                 and policyname = 'admins read student_major') then
    create policy "admins read student_major" on public.student_major
      for select to authenticated using (public.is_admin());
  end if;
end $$;

-- 4. Bank transfer screenshots: anyone could list, download and overwrite them.
--    Storage only exists on real Supabase projects, not in CI's plain Postgres.
do $$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists "event_payments_select_anon" on storage.objects;
    drop policy if exists "event_payments_update" on storage.objects;
    drop policy if exists "event_payments_select_authenticated" on storage.objects;
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                   and policyname = 'event_payments_select_admin') then
      create policy "event_payments_select_admin" on storage.objects
        for select to authenticated using (bucket_id = 'event-payments' and public.is_admin());
    end if;
  end if;
end $$;
