-- Grant admin users (via is_admin() function) SELECT access to all client records
CREATE POLICY "Admins can view all client records"
ON "public"."clients"
FOR SELECT
TO authenticated
USING (public.is_admin());

COMMENT ON POLICY "Admins can view all client records" ON "public"."clients"
IS 'Allows users for whom public.is_admin() returns true to select all client records.'; 