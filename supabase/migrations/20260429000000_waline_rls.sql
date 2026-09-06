-- Lock Waline tables behind Row Level Security while keeping the standalone
-- Waline server on an explicit least-privilege database role.
--
-- Deployment contract:
-- 1. Run waline-server/sql/waline.pgsql first to create wl_* tables/sequences.
-- 2. Create or configure a LOGIN role named `waline` for the Waline server.
-- 3. Point Waline PG_USER at that role instead of a broad postgres owner role.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'waline') THEN
    RAISE EXCEPTION 'Required LOGIN role "waline" does not exist. Create it first, for example: CREATE ROLE waline LOGIN PASSWORD ''<strong-password>'';';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'waline' AND rolcanlogin) THEN
    RAISE EXCEPTION 'Role "waline" must be a LOGIN role before this migration grants table access.';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO waline;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wl_comment TO waline;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wl_counter TO waline;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wl_users   TO waline;

GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.wl_comment_seq TO waline;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.wl_counter_seq TO waline;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.wl_users_seq   TO waline;

ALTER TABLE public.wl_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wl_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wl_users   ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.wl_comment FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wl_counter FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wl_users   FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.wl_comment FROM anon, authenticated;
REVOKE ALL ON public.wl_counter FROM anon, authenticated;
REVOKE ALL ON public.wl_users   FROM anon, authenticated;

DROP POLICY IF EXISTS waline_full_access ON public.wl_comment;
DROP POLICY IF EXISTS waline_full_access ON public.wl_counter;
DROP POLICY IF EXISTS waline_full_access ON public.wl_users;

CREATE POLICY waline_full_access
  ON public.wl_comment
  FOR ALL TO waline
  USING (true)
  WITH CHECK (true);

CREATE POLICY waline_full_access
  ON public.wl_counter
  FOR ALL TO waline
  USING (true)
  WITH CHECK (true);

CREATE POLICY waline_full_access
  ON public.wl_users
  FOR ALL TO waline
  USING (true)
  WITH CHECK (true);
