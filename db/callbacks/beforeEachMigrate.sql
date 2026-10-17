-- Flyway points search_path at its own "flyway" schema while migrating. Reset
-- it so unqualified names in migrations mean public, like in the Supabase SQL
-- editor.
set search_path = public, extensions;
