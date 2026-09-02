/*
# Phase 13.1: Revoke PUBLIC execute on SECURITY DEFINER functions

The default `PUBLIC` role still had EXECUTE on the 4 SECURITY DEFINER functions.
This revokes EXECUTE from PUBLIC, ensuring only the postgres owner and service_role
can call these functions. They are used internally by RLS policies, not by clients.
*/

REVOKE EXECUTE ON FUNCTION can_perform_church_admin_action(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_circle_leader(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_circle_member(uuid, uuid) FROM PUBLIC;
