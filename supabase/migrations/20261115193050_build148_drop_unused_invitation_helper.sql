/*
# Remove unused invitation helper

1. Summary
- Drops private.is_family_owner_of_invitation, a helper created during Build 148 that no policy or function uses.
- The invitation SELECT policy calls private.is_family_owner directly.

2. Security
- No access changes. The removed function was not referenced by any policy or grant.
*/

DROP FUNCTION IF EXISTS private.is_family_owner_of_invitation(uuid);
