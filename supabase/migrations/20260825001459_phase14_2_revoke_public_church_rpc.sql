
-- Revoke EXECUTE from PUBLIC and anon on search_church_directory
-- PUBLIC is the default grant that all roles inherit; must be explicitly revoked.
REVOKE EXECUTE ON FUNCTION search_church_directory(p_query text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION search_church_directory(p_query text) FROM anon;
GRANT EXECUTE ON FUNCTION search_church_directory(p_query text) TO authenticated;
