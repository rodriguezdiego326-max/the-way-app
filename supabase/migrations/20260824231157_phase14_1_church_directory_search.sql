
-- Church directory search: SECURITY DEFINER function that returns only
-- directory-safe fields (id, name, city, website) to authenticated users.
-- Does NOT expose user_id, created_at, or any internal/owner field.
-- RLS on church_profiles remains unchanged.

CREATE OR REPLACE FUNCTION search_church_directory(p_query text)
RETURNS TABLE (id uuid, name text, city text, website text)
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT cp.id, cp.name, cp.city, cp.website
  FROM church_profiles cp
  WHERE (
    p_query IS NULL
    OR p_query = ''
    OR cp.name ILIKE '%' || p_query || '%'
    OR cp.city ILIKE '%' || p_query || '%'
  )
  ORDER BY cp.name
  LIMIT 20;
$$;

REVOKE EXECUTE ON FUNCTION search_church_directory FROM anon;
GRANT EXECUTE ON FUNCTION search_church_directory TO authenticated;
