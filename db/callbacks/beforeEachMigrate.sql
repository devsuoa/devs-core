-- Flyway switches search_path to its own schema; unqualified names in migrations mean public.
set search_path = public, extensions;
