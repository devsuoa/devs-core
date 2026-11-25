-- Fake data for local Docker and the API's tests. Never run against a real project:
-- every person here is made up, and the ids are fixed so tests can mint tokens for them.

-- Local logins (pnpm dev only, password "development"): techexec, pres and superuser @example.test.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-000000000001', 'techexec@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-000000000002', 'superuser@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-000000000003', 'user@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-000000000004', 'pres@example.test', 'authenticated', 'authenticated')
on conflict (id) do update set email = excluded.email;

insert into public.profiles (id, role, username, team, is_superuser) values
  ('00000000-0000-4000-8000-000000000001', 'admin', 'techexec', 'tech', false),
  ('00000000-0000-4000-8000-000000000002', 'admin', 'superuser', 'president', true),
  ('00000000-0000-4000-8000-000000000003', 'user', 'Una User', null, false),
  ('00000000-0000-4000-8000-000000000004', 'admin', 'pres', 'president', false)
-- on_auth_user_created has already made a plain 'user' profile for each, as on a real project.
on conflict (id) do update set
  role = excluded.role, username = excluded.username, team = excluded.team, is_superuser = excluded.is_superuser;

insert into public.degrees (id, name) values
  ('10000000-0000-4000-8000-000000000001', 'Bachelor of Science'),
  ('10000000-0000-4000-8000-000000000002', 'Bachelor of Engineering (Honours)')
on conflict do nothing;

insert into public.majors (id, name) values
  ('20000000-0000-4000-8000-000000000001', 'Computer Science'),
  ('20000000-0000-4000-8000-000000000002', 'Software Engineering')
on conflict do nothing;

insert into public.degree_major (degree_id, major_id) values
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002')
on conflict do nothing;

insert into public.members (email, first_name, last_name, gender, student_id, upi, university_year, university) values
  ('kiri@example.test', 'Kiri', 'Example', 'female', 900000001, 'kexa001', 2, 'UOA'),
  ('tane@example.test', 'Tane', 'Example', 'male', 900000002, 'texa002', 3, 'UOA')
on conflict do nothing;

insert into public.student_degree (student_id, degree_id) values
  (900000001, '10000000-0000-4000-8000-000000000001')
on conflict do nothing;

insert into public.events (id, title, description, event_date, is_active, max_attendees, group_rsvp_enabled,
                           group_rsvp_max_emails, rsvp_questions, payment_enabled, charge_amount, bank_transfer_enabled,
                           google_sheet_url) values
  ('30000000-0000-4000-8000-000000000001', 'Free Workshop', 'Bring a laptop.', current_date + 14, true, null, true, 4,
   '[{"id":"level","prompt":"Experience level","type":"single_select","required":true,"options":["New","Some","Lots"]}]',
   false, null, false, 'https://docs.google.com/spreadsheets/d/internal-only'),
  ('30000000-0000-4000-8000-000000000002', 'Paid Hackathon', 'Food included.', current_date + 30, true, 100, false, null,
   '[]', true, 10.00, true, null),
  ('30000000-0000-4000-8000-000000000003', 'Tiny Meetup', 'One seat only.', current_date + 7, true, 1, false, null,
   '[]', false, null, false, null),
  ('30000000-0000-4000-8000-000000000004', 'Hidden Draft', 'Not published yet.', current_date + 60, false, null, false, null,
   '[]', false, null, false, null)
on conflict do nothing;

insert into public.links (title, url, is_active, display_order, is_spacer)
select * from (values
  ('Join DEVS', 'https://devsuoa.com/join', true, 0, false),
  ('Old form', 'https://example.test/old', false, 1, false),
  ('', '', true, 2, true)) as v
where not exists (select 1 from public.links);
