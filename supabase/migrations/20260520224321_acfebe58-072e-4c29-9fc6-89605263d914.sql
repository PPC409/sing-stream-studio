
DROP POLICY IF EXISTS "Public audio read" ON storage.objects;
DROP POLICY IF EXISTS "Public covers read" ON storage.objects;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
