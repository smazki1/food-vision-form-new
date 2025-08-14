-- Cleanup legacy grants that allowed anon access, if present in earlier migration
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'public_submissions'
  ) THEN
    REVOKE ALL ON TABLE public.public_submissions FROM anon;
  END IF;
END $$;


