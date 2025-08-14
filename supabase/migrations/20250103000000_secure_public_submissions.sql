-- Secure public_submissions: enable RLS and restrict access
-- Migration timestamp: 2025-01-03

DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'public_submissions';
  IF NOT FOUND THEN
    RAISE NOTICE 'Table public.public_submissions does not exist. Skipping.';
    RETURN;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.public_submissions ENABLE ROW LEVEL SECURITY;

-- Revoke broad access
REVOKE ALL ON TABLE public.public_submissions FROM PUBLIC;
REVOKE ALL ON TABLE public.public_submissions FROM anon;
REVOKE ALL ON TABLE public.public_submissions FROM authenticated;

-- Drop legacy permissive policies if exist
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "public_submissions_all" ON public.public_submissions';
  EXECUTE 'DROP POLICY IF EXISTS "public_submissions_insert" ON public.public_submissions';
  EXECUTE 'DROP POLICY IF EXISTS "public_submissions_select" ON public.public_submissions';
END $$;

-- Allow only admins (via public.is_admin()) to view/manage
CREATE POLICY "admin_full_access_public_submissions"
ON public.public_submissions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Harden processing function if present
DO $$ BEGIN
  PERFORM 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'process_public_submission';

  IF FOUND THEN
    ALTER FUNCTION public.process_public_submission(UUID, UUID) SECURITY DEFINER;
    REVOKE ALL ON FUNCTION public.process_public_submission(UUID, UUID) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.process_public_submission(UUID, UUID) FROM anon;
    GRANT EXECUTE ON FUNCTION public.process_public_submission(UUID, UUID) TO authenticated;
  END IF;
END $$;


