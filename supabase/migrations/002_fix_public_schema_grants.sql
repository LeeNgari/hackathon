-- =============================================================================
-- Fix "permission denied for schema public" (PostgreSQL 42501)
-- PostgREST / Supabase API needs USAGE on schema public and table privileges
-- for anon, authenticated, and service_role. Run this if your backend gets
-- that error when using the service role key.
-- =============================================================================

-- Schema usage (required for PostgREST to see tables)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Table privileges: service_role gets full access; anon/authenticated get
-- read/write (RLS policies still apply for anon/authenticated)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Sequences (for default values / serial columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
