-- The Java API's own database role. It gets exactly the tables it uses, through explicit
-- grants and RLS policies, and nothing else: no superuser, no BYPASSRLS, no auth schema.
--
-- The role is created without a password. Set one out of band, never in a migration:
--   alter role api_app with password '...';
-- and connect through the session pooler as api_app.<project ref>.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'api_app') then
    create role api_app login noinherit;
  end if;
end $$;

grant usage on schema public to api_app;

-- Read and write.
grant select, insert, update, delete on
  public.events,
  public.events_rsvp,
  public.event_rsvp_pending_payments,
  public.event_todo_items,
  public.event_notes,
  public.event_doc_links,
  public.links,
  public.members,
  public.student_degree,
  public.student_major,
  public.tasks,
  public.task_comments,
  public.marketing_requests
to api_app;

-- Read only.
grant select on
  public.degrees,
  public.majors,
  public.degree_major,
  public.member_registry,
  public.admin_audit_log
to api_app;

-- Profiles: the API reads roles and promotes invited execs. It never touches is_superuser.
grant select on public.profiles to api_app;
grant insert (id, role, username, team), update (role, username, team) on public.profiles to api_app;

grant usage on all sequences in schema public to api_app;

-- The API checks the schema version on startup.
grant usage on schema flyway to api_app;
grant select on flyway.flyway_schema_history to api_app;

-- To-do comments: the page has used this table, but it was never created in production.
create table if not exists public.event_todo_comments (
  id uuid primary key default gen_random_uuid(),
  todo_item_id uuid not null references public.event_todo_items (id) on delete cascade,
  author_id uuid references auth.users (id),
  author_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists event_todo_comments_todo_item_id_idx on public.event_todo_comments (todo_item_id);
alter table public.event_todo_comments enable row level security;
-- Supabase's default privileges grant every new public table to anon and authenticated.
revoke all on public.event_todo_comments from anon, authenticated;
grant select, insert, update, delete on public.event_todo_comments to api_app;

-- RLS stays on everywhere. These policies let api_app through; every other role still
-- goes through the existing policies.
do $$
declare
  t text;
begin
  foreach t in array array[
    'events', 'events_rsvp', 'event_rsvp_pending_payments', 'event_todo_items', 'event_notes',
    'event_doc_links', 'event_todo_comments', 'links', 'members', 'student_degree', 'student_major',
    'tasks', 'task_comments', 'marketing_requests', 'profiles']
  loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'api_app access') then
      execute format('create policy "api_app access" on public.%I for all to api_app using (true) with check (true)', t);
    end if;
  end loop;

  foreach t in array array['degrees', 'majors', 'degree_major', 'admin_audit_log']
  loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'api_app read') then
      execute format('create policy "api_app read" on public.%I for select to api_app using (true)', t);
    end if;
  end loop;
end $$;
