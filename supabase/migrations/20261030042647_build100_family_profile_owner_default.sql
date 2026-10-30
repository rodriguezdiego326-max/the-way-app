/*
# Family Profile owner default and one-profile-per-user guard

1. Modified Tables
- `family_profiles.profile_id` now defaults to `auth.uid()`, so the signed-in user is recorded as the owner when a Family Profile is created without an explicit owner. This matches every other owner-scoped table.
- New unique index on `family_profiles(profile_id)` so a user cannot end up with two Family Profiles (for example from a rapid double tap).

2. Security
- No RLS policy is changed or relaxed. Existing policies still require `auth.uid() = profile_id` for select, insert, update and delete.
- No anonymous access is added. No grants are changed.
- Existing rows are not modified or deleted.

3. Important Notes
- Rows where `profile_id` is NULL remain as they are. They are not visible to any user under the existing policies.
*/

ALTER TABLE family_profiles ALTER COLUMN profile_id SET DEFAULT auth.uid();

CREATE UNIQUE INDEX IF NOT EXISTS family_profiles_profile_id_key ON family_profiles (profile_id);
