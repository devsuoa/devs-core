-- Baseline: the production schema as of 2026-10-16 (supabase db dump).
-- Production is already at this version, so it is never run there; it only
-- builds fresh databases (CI, dev). See kb/database_migrations.md.
--
-- Removed from the dump: the "marketing_webhook" trigger on
-- public.marketing_requests. It calls the prod edge function URL with a
-- Supabase key inlined, so it cannot live in git or point at the right
-- project in other environments. It still exists in prod.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."gender_enum" AS ENUM (
    'male',
    'female',
    'non-binary',
    'prefer-not-to-say'
);

ALTER TYPE "public"."gender_enum" OWNER TO "postgres";

CREATE TYPE "public"."team_enum" AS ENUM (
    'president',
    'senior_advisor',
    'admin',
    'marketing',
    'competitions',
    'industry',
    'tech',
    'social'
);

ALTER TYPE "public"."team_enum" OWNER TO "postgres";

COMMENT ON TYPE "public"."team_enum" IS 'Enum of all the teams';

CREATE TYPE "public"."university_enum" AS ENUM (
    'UOA',
    'AUT',
    'Other'
);

ALTER TYPE "public"."university_enum" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."events_rsvp_before_insert_enforce"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_event record;
  v_requested_seats integer;
  v_current_seats integer;
begin
  select
    e.id,
    e.max_attendees,
    e.group_rsvp_enabled,
    e.group_rsvp_max_emails
  into v_event
  from public.events e
  where e.id = new.event_id
  for update;

  if not found then
    raise exception 'Event % not found', new.event_id;
  end if;

  if new.group_emails is null
    or jsonb_typeof(new.group_emails) <> 'array'
    or jsonb_array_length(new.group_emails) = 0
  then
    new.group_emails := jsonb_build_array(new.email);
  end if;

  v_requested_seats := public.rsvp_seat_count(new.group_emails);

  if v_event.group_rsvp_enabled = false and v_requested_seats > 1 then
    raise exception 'Group RSVP is not enabled for this event';
  end if;

  if v_event.group_rsvp_enabled = true
     and v_event.group_rsvp_max_emails is not null
     and v_requested_seats > v_event.group_rsvp_max_emails then
    raise exception 'Group RSVP size exceeds configured max (%).', v_event.group_rsvp_max_emails;
  end if;

  if v_event.max_attendees is not null then
    select coalesce(sum(public.rsvp_seat_count(r.group_emails)), 0)
    into v_current_seats
    from public.events_rsvp r
    where r.event_id = new.event_id;

    if v_current_seats + v_requested_seats > v_event.max_attendees then
      raise exception 'Event is full (capacity: %, requested seats: %, remaining: %)',
        v_event.max_attendees,
        v_requested_seats,
        greatest(v_event.max_attendees - v_current_seats, 0);
    end if;
  end if;

  return new;
end;
$$;

ALTER FUNCTION "public"."events_rsvp_before_insert_enforce"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."events_rsvp_present_stamp"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.present is true and coalesce(old.present, false) is false then
    new.present_marked_at := now();
  elsif new.present is false and coalesce(old.present, false) is true then
    new.present_marked_at := null;
  end if;
  return new;
end;
$$;

ALTER FUNCTION "public"."events_rsvp_present_stamp"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, role, username)
  values (
    new.id,
    'user',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."log_admin_action"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$declare
  _auth_id uuid := auth.uid();
  _admin_name text := (select username from profiles where id = _auth_id);
  _admin_team text := (select team from profiles where id = _auth_id);
  _headers jsonb := current_setting('request.headers', true)::jsonb;
  _undo_of text := (_headers ->> 'x-audit-undo')::text;
  _old_data jsonb;
  _new_data jsonb;
  _target_id text;
begin
  if (TG_OP = 'DELETE') then
    _old_data := row_to_json(old)::jsonb;
    _new_data := null;
  elsif (TG_OP = 'UPDATE') then
    _old_data := row_to_json(old)::jsonb;
    _new_data := row_to_json(new)::jsonb;
  else
    _old_data := null;
    _new_data := row_to_json(new)::jsonb;
  end if;

  _target_id := coalesce(
    _new_data ->> 'id',
    _old_data ->> 'id',
    _new_data ->> 'student_id',
    _old_data ->> 'student_id'
  );

  insert into public.admin_audit_log (
    target_id,
    target_table,
    action,
    admin_name,
    admin_team,
    user_agent,
    ip_address,
    auth_id,
    target_old,
    target_new,
    undo_of
  )
  values (
    _target_id,
    TG_TABLE_NAME::text,
    TG_OP,
    coalesce( _admin_name, 'unknown'),
    coalesce(_admin_team, _headers ->> 'x-edge-function', 'db-access'),
    coalesce(_headers ->> 'user-agent', 'server'),
    coalesce(
      _headers ->> 'cf-connecting-ip',
      _headers ->> 'x-forwarded-for',
      '0.0.0.0'
    ),
    coalesce(_auth_id, '00000000-0000-0000-0000-000000000000'),
    _old_data,
    _new_data,
    _undo_of
  );

  return coalesce(new, old);
end;$$;

ALTER FUNCTION "public"."log_admin_action"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."rsvp_seat_count"("group_emails" "jsonb") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select greatest(1, coalesce(jsonb_array_length(group_emails), 0));
$$;

ALTER FUNCTION "public"."rsvp_seat_count"("group_emails" "jsonb") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "target_id" character varying NOT NULL,
    "target_table" character varying DEFAULT ''::character varying NOT NULL,
    "action" character varying DEFAULT ''::character varying NOT NULL,
    "admin_name" character varying DEFAULT ''::character varying NOT NULL,
    "admin_team" character varying DEFAULT ''::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_agent" character varying DEFAULT ''::character varying NOT NULL,
    "ip_address" character varying DEFAULT ''::character varying NOT NULL,
    "auth_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "target_old" "jsonb",
    "target_new" "jsonb",
    "undo_of" "text"
);

ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";

COMMENT ON TABLE "public"."admin_audit_log" IS 'Logs admin actions';

CREATE TABLE IF NOT EXISTS "public"."degree_major" (
    "degree_id" "uuid" NOT NULL,
    "major_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."degree_major" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."degrees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."degrees" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."event_doc_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."event_doc_links" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."event_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."event_notes" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."event_rsvp_pending_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "leader_email" "text" NOT NULL,
    "dietary_requirements" "text",
    "group_emails" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "rsvp_answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "stripe_checkout_session_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "failure_reason" "text",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "event_rsvp_pending_payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])))
);

ALTER TABLE "public"."event_rsvp_pending_payments" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."event_todo_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "item_notes" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."event_todo_items" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "tag" "text",
    "event_date" "date" NOT NULL,
    "event_time" "text",
    "location" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "register_url" "text",
    "max_attendees" integer,
    "group_rsvp_enabled" boolean DEFAULT false NOT NULL,
    "group_rsvp_max_emails" integer,
    "rsvp_questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "payment_enabled" boolean DEFAULT false NOT NULL,
    "charge_amount" numeric(10,2),
    "google_sheet_linked" boolean DEFAULT false NOT NULL,
    "google_sheet_url" "text",
    "bank_transfer_enabled" boolean DEFAULT false NOT NULL,
    "bank_account_name" "text",
    "bank_account_number" "text",
    CONSTRAINT "events_charge_amount_non_negative" CHECK ((("charge_amount" IS NULL) OR ("charge_amount" >= (0)::numeric))),
    CONSTRAINT "events_charge_amount_requires_payment_enabled" CHECK ((("payment_enabled" = true) OR ("charge_amount" IS NULL))),
    CONSTRAINT "events_group_max_positive_chk" CHECK ((("group_rsvp_max_emails" IS NULL) OR ("group_rsvp_max_emails" > 0))),
    CONSTRAINT "events_group_requires_max_chk" CHECK (((("group_rsvp_enabled" = false) AND ("group_rsvp_max_emails" IS NULL)) OR (("group_rsvp_enabled" = true) AND ("group_rsvp_max_emails" IS NOT NULL)))),
    CONSTRAINT "events_max_attendees_positive_chk" CHECK ((("max_attendees" IS NULL) OR ("max_attendees" > 0))),
    CONSTRAINT "events_rsvp_questions_array_chk" CHECK (("jsonb_typeof"("rsvp_questions") = 'array'::"text"))
);

ALTER TABLE "public"."events" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."events_rsvp" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "dietary_requirements" "text",
    "group_emails" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "rsvp_answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "present" boolean DEFAULT false NOT NULL,
    "present_marked_at" timestamp with time zone,
    "payment_method" "text",
    "bank_payment_proof_path" "text",
    CONSTRAINT "events_rsvp_answers_object_chk" CHECK (("jsonb_typeof"("rsvp_answers") = 'object'::"text")),
    CONSTRAINT "events_rsvp_group_emails_array_chk" CHECK (("jsonb_typeof"("group_emails") = 'array'::"text"))
);

ALTER TABLE "public"."events_rsvp" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "active_from" timestamp with time zone,
    "active_to" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_spacer" boolean DEFAULT false NOT NULL,
    "custom_icon" "text"
);

ALTER TABLE "public"."links" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."majors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."majors" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."marketing_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_type" "text" NOT NULL,
    "event_name" "text",
    "event_date" "date",
    "event_time" "text",
    "event_location" "text",
    "event_description" "text",
    "event_suggestions" "text",
    "sponsor_name" "text",
    "sponsorship_email_date" "date",
    "sponsorship_post_date" "date",
    "sponsorship_event_name" "text",
    "sponsorship_links" "text",
    "sponsorship_description" "text",
    "marketing_description" "text",
    "pre_written_captions" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "marketing_requests_post_type_check" CHECK (("post_type" = ANY (ARRAY['event'::"text", 'sponsorship'::"text"])))
);

ALTER TABLE "public"."marketing_requests" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."members" (
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "gender" "public"."gender_enum",
    "student_id" bigint,
    "upi" "text",
    "university_year" smallint,
    "dietary_requirements" "text",
    "university" "public"."university_enum"
);

ALTER TABLE "public"."members" OWNER TO "postgres";

COMMENT ON TABLE "public"."members" IS 'DEVS Members';

CREATE TABLE IF NOT EXISTS "public"."student_degree" (
    "degree_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."student_degree" OWNER TO "postgres";

COMMENT ON TABLE "public"."student_degree" IS 'Student Degree join table';

CREATE TABLE IF NOT EXISTS "public"."student_major" (
    "student_id" bigint NOT NULL,
    "major_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "degree_id" "uuid" NOT NULL
);

ALTER TABLE "public"."student_major" OWNER TO "postgres";

COMMENT ON TABLE "public"."student_major" IS 'Student major join table';

CREATE OR REPLACE VIEW "public"."member_registry" WITH ("security_invoker"='on') AS
 SELECT "m"."student_id",
    "m"."first_name",
    "m"."last_name",
    "m"."email",
    "m"."university",
    "m"."university_year",
    "m"."gender",
    "m"."created_at",
    "array_agg"(DISTINCT "d"."name" ORDER BY "d"."name") FILTER (WHERE ("d"."name" IS NOT NULL)) AS "degrees",
    "array_agg"(DISTINCT "mj"."name" ORDER BY "mj"."name") FILTER (WHERE ("mj"."name" IS NOT NULL)) AS "majors"
   FROM (((("public"."members" "m"
     LEFT JOIN "public"."student_degree" "sd" ON (("sd"."student_id" = "m"."student_id")))
     LEFT JOIN "public"."degrees" "d" ON (("d"."id" = "sd"."degree_id")))
     LEFT JOIN "public"."student_major" "sm" ON (("sm"."student_id" = "sd"."student_id")))
     LEFT JOIN "public"."majors" "mj" ON (("mj"."id" = "sm"."major_id")))
  GROUP BY "m"."student_id", "m"."first_name", "m"."last_name", "m"."email", "m"."university", "m"."university_year", "m"."gender", "m"."created_at";

ALTER VIEW "public"."member_registry" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" DEFAULT 'user'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" "text",
    "team" "public"."team_enum",
    "is_superuser" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

COMMENT ON TABLE "public"."profiles" IS 'DEVS Admin Login Profiles';

COMMENT ON COLUMN "public"."profiles"."team" IS 'What team is the member in';

COMMENT ON COLUMN "public"."profiles"."is_superuser" IS 'top level access to CMS';

ALTER TABLE "public"."student_major" ALTER COLUMN "student_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."student_major_student_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "text",
    "author_id" "uuid",
    "author_name" "text" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."task_comments" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "label" "text" NOT NULL,
    "assignee" "text",
    "status" "text" NOT NULL,
    "description" "text",
    "team" "public"."team_enum" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "archived" boolean DEFAULT false NOT NULL,
    "due_date" "date",
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['todo'::"text", 'doing'::"text", 'review'::"text", 'done'::"text"])))
);

ALTER TABLE "public"."tasks" OWNER TO "postgres";

ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."degree_major"
    ADD CONSTRAINT "degree_major_pkey" PRIMARY KEY ("degree_id", "major_id");

ALTER TABLE ONLY "public"."degrees"
    ADD CONSTRAINT "degrees_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."degrees"
    ADD CONSTRAINT "degrees_name_unique" UNIQUE ("name");

ALTER TABLE ONLY "public"."degrees"
    ADD CONSTRAINT "degrees_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."event_doc_links"
    ADD CONSTRAINT "event_doc_links_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."event_notes"
    ADD CONSTRAINT "event_notes_event_id_key" UNIQUE ("event_id");

ALTER TABLE ONLY "public"."event_notes"
    ADD CONSTRAINT "event_notes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."event_rsvp_pending_payments"
    ADD CONSTRAINT "event_rsvp_pending_payments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."event_todo_items"
    ADD CONSTRAINT "event_todo_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."events_rsvp"
    ADD CONSTRAINT "events_rsvp_event_id_email_key" UNIQUE ("event_id", "email");

ALTER TABLE ONLY "public"."events_rsvp"
    ADD CONSTRAINT "events_rsvp_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."links"
    ADD CONSTRAINT "links_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."majors"
    ADD CONSTRAINT "majors_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."majors"
    ADD CONSTRAINT "majors_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("email");

ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_student_id_key" UNIQUE ("student_id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."student_degree"
    ADD CONSTRAINT "student_degree_pkey" PRIMARY KEY ("student_id", "degree_id");

ALTER TABLE ONLY "public"."student_degree"
    ADD CONSTRAINT "student_degree_unique" UNIQUE ("student_id", "degree_id");

ALTER TABLE ONLY "public"."student_major"
    ADD CONSTRAINT "student_major_pkey" PRIMARY KEY ("student_id", "degree_id", "major_id");

ALTER TABLE ONLY "public"."student_major"
    ADD CONSTRAINT "student_major_unique" UNIQUE ("student_id", "degree_id", "major_id");

ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "idx_event_rsvp_pending_checkout_session" ON "public"."event_rsvp_pending_payments" USING "btree" ("stripe_checkout_session_id") WHERE ("stripe_checkout_session_id" IS NOT NULL);

CREATE INDEX "idx_event_rsvp_pending_event_id" ON "public"."event_rsvp_pending_payments" USING "btree" ("event_id");

CREATE OR REPLACE TRIGGER "events_logger" AFTER INSERT OR DELETE OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();

CREATE OR REPLACE TRIGGER "events_rsvp_logger" AFTER INSERT OR DELETE OR UPDATE ON "public"."events_rsvp" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();

CREATE OR REPLACE TRIGGER "links_logger" AFTER INSERT OR DELETE OR UPDATE ON "public"."links" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();

CREATE OR REPLACE TRIGGER "marketing_requests_logger" AFTER INSERT OR DELETE OR UPDATE ON "public"."marketing_requests" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();

CREATE OR REPLACE TRIGGER "member_logger" AFTER INSERT OR DELETE OR UPDATE ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();

CREATE OR REPLACE TRIGGER "profiles_logger" AFTER INSERT OR DELETE OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();

CREATE OR REPLACE TRIGGER "task_comments_logger" AFTER INSERT OR DELETE OR UPDATE ON "public"."task_comments" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();

CREATE OR REPLACE TRIGGER "tasks_logger" AFTER INSERT OR DELETE OR UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_action"();

CREATE OR REPLACE TRIGGER "trg_events_rsvp_before_insert_enforce" BEFORE INSERT ON "public"."events_rsvp" FOR EACH ROW EXECUTE FUNCTION "public"."events_rsvp_before_insert_enforce"();

CREATE OR REPLACE TRIGGER "trg_events_rsvp_present_stamp" BEFORE UPDATE OF "present" ON "public"."events_rsvp" FOR EACH ROW EXECUTE FUNCTION "public"."events_rsvp_present_stamp"();

CREATE OR REPLACE TRIGGER "update_links_updated_at" BEFORE UPDATE ON "public"."links" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

ALTER TABLE ONLY "public"."degree_major"
    ADD CONSTRAINT "degree_major_degree_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."degree_major"
    ADD CONSTRAINT "degree_major_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."event_doc_links"
    ADD CONSTRAINT "event_doc_links_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."event_notes"
    ADD CONSTRAINT "event_notes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."event_rsvp_pending_payments"
    ADD CONSTRAINT "event_rsvp_pending_payments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."event_todo_items"
    ADD CONSTRAINT "event_todo_items_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."events_rsvp"
    ADD CONSTRAINT "events_rsvp_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."members"("email") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."events_rsvp"
    ADD CONSTRAINT "events_rsvp_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."student_degree"
    ADD CONSTRAINT "student_degree_degree_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id");

ALTER TABLE ONLY "public"."student_degree"
    ADD CONSTRAINT "student_degree_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."members"("student_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."student_degree"
    ADD CONSTRAINT "student_degree_valid" FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id");

ALTER TABLE ONLY "public"."student_major"
    ADD CONSTRAINT "student_major_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id");

ALTER TABLE ONLY "public"."student_major"
    ADD CONSTRAINT "student_major_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."members"("student_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."student_major"
    ADD CONSTRAINT "student_major_valid_combo" FOREIGN KEY ("degree_id", "major_id") REFERENCES "public"."degree_major"("degree_id", "major_id");

ALTER TABLE ONLY "public"."student_major"
    ADD CONSTRAINT "student_major_valid_degree_major" FOREIGN KEY ("degree_id", "major_id") REFERENCES "public"."degree_major"("degree_id", "major_id") ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;

CREATE POLICY "Admin full access" ON "public"."event_doc_links" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));

CREATE POLICY "Admin full access" ON "public"."event_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));

CREATE POLICY "Admin full access" ON "public"."event_todo_items" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));

CREATE POLICY "Admin insert only" ON "public"."marketing_requests" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Admin select only" ON "public"."marketing_requests" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Admin update only" ON "public"."marketing_requests" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Admins can delete events" ON "public"."events" FOR DELETE USING ("public"."is_admin"());

CREATE POLICY "Admins can delete links" ON "public"."links" FOR DELETE USING ("public"."is_admin"());

CREATE POLICY "Admins can insert events" ON "public"."events" FOR INSERT WITH CHECK ("public"."is_admin"());

CREATE POLICY "Admins can insert links" ON "public"."links" FOR INSERT WITH CHECK ("public"."is_admin"());

CREATE POLICY "Admins can manage all events" ON "public"."events" USING (("public"."is_admin"() = true)) WITH CHECK (("public"."is_admin"() = true));

CREATE POLICY "Admins can read profiles" ON "public"."profiles" FOR SELECT USING (true);

CREATE POLICY "Admins can update links" ON "public"."links" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Anyone can read links" ON "public"."links" FOR SELECT USING (true);

CREATE POLICY "Public can read active events" ON "public"."events" FOR SELECT USING (("is_active" = true));

CREATE POLICY "Read access for superusers" ON "public"."admin_audit_log" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."is_superuser" IS TRUE))));

CREATE POLICY "User can read own profiles" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));

CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "admin read degree_major" ON "public"."degree_major" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "admin read degrees" ON "public"."degrees" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "admin read majors" ON "public"."majors" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "admin read members" ON "public"."members" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "admin read student_degree" ON "public"."student_degree" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "admin read student_major" ON "public"."student_major" FOR SELECT USING (("auth"."role"() = 'admin'::"text"));

ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can comment on visible tasks" ON "public"."task_comments" FOR INSERT WITH CHECK (((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text") AND ("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE (("tasks"."team" = ( SELECT "profiles"."team"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))) OR (( SELECT "profiles"."team"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['president'::"public"."team_enum", 'senior_advisor'::"public"."team_enum"])))))));

CREATE POLICY "admins can modify tasks" ON "public"."tasks" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));

CREATE POLICY "allow admin read rsvps" ON "public"."events_rsvp" FOR SELECT USING ("public"."is_admin"());

CREATE POLICY "allow public rsvp insert" ON "public"."events_rsvp" FOR INSERT WITH CHECK (true);

CREATE POLICY "allow read degree_major" ON "public"."degree_major" FOR SELECT USING (true);

CREATE POLICY "allow read majors" ON "public"."majors" FOR SELECT USING (true);

CREATE POLICY "allow read student_major" ON "public"."student_major" FOR SELECT USING (true);

ALTER TABLE "public"."degree_major" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."degrees" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_client_access_event_rsvp_pending_payments" ON "public"."event_rsvp_pending_payments" USING (false) WITH CHECK (false);

ALTER TABLE "public"."event_doc_links" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_notes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_rsvp_pending_payments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_todo_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."events_rsvp" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_rsvp_admin_select" ON "public"."events_rsvp" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));

CREATE POLICY "events_rsvp_admin_update_present" ON "public"."events_rsvp" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));

CREATE POLICY "events_rsvp_public_insert" ON "public"."events_rsvp" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);

ALTER TABLE "public"."links" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."majors" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."marketing_requests" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no public delete members" ON "public"."members" FOR DELETE TO "anon" USING (false);

CREATE POLICY "no public delete student_degree" ON "public"."student_degree" FOR DELETE TO "anon" USING (false);

CREATE POLICY "no public delete student_major" ON "public"."student_major" FOR DELETE TO "anon" USING (false);

CREATE POLICY "no public read members" ON "public"."members" FOR SELECT TO "anon" USING (false);

CREATE POLICY "no public read student_degree" ON "public"."student_degree" FOR SELECT TO "anon" USING (false);

CREATE POLICY "no public read student_major" ON "public"."student_major" FOR SELECT TO "anon" USING (false);

CREATE POLICY "no public update members" ON "public"."members" FOR UPDATE TO "anon" USING (false);

CREATE POLICY "no public update student_degree" ON "public"."student_degree" FOR UPDATE TO "anon" USING (false);

CREATE POLICY "no public update student_major" ON "public"."student_major" FOR UPDATE TO "anon" USING (false);

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public insert members" ON "public"."members" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);

CREATE POLICY "public insert student_degree" ON "public"."student_degree" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);

CREATE POLICY "public insert student_major" ON "public"."student_major" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);

CREATE POLICY "public read degree_major" ON "public"."degree_major" FOR SELECT USING (true);

CREATE POLICY "public read degrees" ON "public"."degrees" FOR SELECT USING (true);

CREATE POLICY "public read majors" ON "public"."majors" FOR SELECT USING (true);

ALTER TABLE "public"."student_degree" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."student_major" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team members can read comments" ON "public"."task_comments" FOR SELECT USING (("task_id" IN ( SELECT "tasks"."id"
   FROM "public"."tasks"
  WHERE (("tasks"."team" = ( SELECT "profiles"."team"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))) OR (( SELECT "profiles"."team"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['president'::"public"."team_enum", 'senior_advisor'::"public"."team_enum"]))))));

CREATE POLICY "team members or exec can read tasks" ON "public"."tasks" FOR SELECT USING ((("archived" = false) AND (("team" = ( SELECT "profiles"."team"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) OR (( SELECT "profiles"."team"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['president'::"public"."team_enum", 'senior_advisor'::"public"."team_enum"])))));

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."events_rsvp_before_insert_enforce"() TO "anon";
GRANT ALL ON FUNCTION "public"."events_rsvp_before_insert_enforce"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."events_rsvp_before_insert_enforce"() TO "service_role";

GRANT ALL ON FUNCTION "public"."events_rsvp_present_stamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."events_rsvp_present_stamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."events_rsvp_present_stamp"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";

GRANT ALL ON FUNCTION "public"."log_admin_action"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action"() TO "service_role";

GRANT ALL ON FUNCTION "public"."rsvp_seat_count"("group_emails" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."rsvp_seat_count"("group_emails" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rsvp_seat_count"("group_emails" "jsonb") TO "service_role";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";

GRANT ALL ON TABLE "public"."degree_major" TO "anon";
GRANT ALL ON TABLE "public"."degree_major" TO "authenticated";
GRANT ALL ON TABLE "public"."degree_major" TO "service_role";

GRANT ALL ON TABLE "public"."degrees" TO "anon";
GRANT ALL ON TABLE "public"."degrees" TO "authenticated";
GRANT ALL ON TABLE "public"."degrees" TO "service_role";

GRANT ALL ON TABLE "public"."event_doc_links" TO "anon";
GRANT ALL ON TABLE "public"."event_doc_links" TO "authenticated";
GRANT ALL ON TABLE "public"."event_doc_links" TO "service_role";

GRANT ALL ON TABLE "public"."event_notes" TO "anon";
GRANT ALL ON TABLE "public"."event_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."event_notes" TO "service_role";

GRANT ALL ON TABLE "public"."event_rsvp_pending_payments" TO "anon";
GRANT ALL ON TABLE "public"."event_rsvp_pending_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."event_rsvp_pending_payments" TO "service_role";

GRANT ALL ON TABLE "public"."event_todo_items" TO "anon";
GRANT ALL ON TABLE "public"."event_todo_items" TO "authenticated";
GRANT ALL ON TABLE "public"."event_todo_items" TO "service_role";

GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";

GRANT ALL ON TABLE "public"."events_rsvp" TO "anon";
GRANT ALL ON TABLE "public"."events_rsvp" TO "authenticated";
GRANT ALL ON TABLE "public"."events_rsvp" TO "service_role";

GRANT ALL ON TABLE "public"."links" TO "anon";
GRANT ALL ON TABLE "public"."links" TO "authenticated";
GRANT ALL ON TABLE "public"."links" TO "service_role";

GRANT ALL ON TABLE "public"."majors" TO "anon";
GRANT ALL ON TABLE "public"."majors" TO "authenticated";
GRANT ALL ON TABLE "public"."majors" TO "service_role";

GRANT ALL ON TABLE "public"."marketing_requests" TO "anon";
GRANT ALL ON TABLE "public"."marketing_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_requests" TO "service_role";

GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";

GRANT ALL ON TABLE "public"."student_degree" TO "anon";
GRANT ALL ON TABLE "public"."student_degree" TO "authenticated";
GRANT ALL ON TABLE "public"."student_degree" TO "service_role";

GRANT ALL ON TABLE "public"."student_major" TO "anon";
GRANT ALL ON TABLE "public"."student_major" TO "authenticated";
GRANT ALL ON TABLE "public"."student_major" TO "service_role";

GRANT ALL ON TABLE "public"."member_registry" TO "anon";
GRANT ALL ON TABLE "public"."member_registry" TO "authenticated";
GRANT ALL ON TABLE "public"."member_registry" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."student_major_student_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."student_major_student_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."student_major_student_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";

GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

