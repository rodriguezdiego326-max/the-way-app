
-- Harden search_church_directory: SET search_path = '' with schema-qualified references.
-- Recreate the function with public.church_profiles explicitly qualified.
-- Re-apply EXECUTE grants to preserve the authenticated-only access.

CREATE OR REPLACE FUNCTION public.search_church_directory(p_query text)
RETURNS TABLE (id uuid, name text, city text, website text)
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT cp.id, cp.name, cp.city, cp.website
  FROM public.church_profiles cp
  WHERE (
    p_query IS NULL
    OR p_query = ''
    OR cp.name ILIKE '%' || p_query || '%'
    OR cp.city ILIKE '%' || p_query || '%'
  )
  ORDER BY cp.name
  LIMIT 20;
$$;

-- Re-apply privileges: CREATE OR REPLACE resets proacl to default (PUBLIC EXECUTE)
REVOKE EXECUTE ON FUNCTION public.search_church_directory(p_query text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_church_directory(p_query text) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_church_directory(p_query text) TO authenticated;
