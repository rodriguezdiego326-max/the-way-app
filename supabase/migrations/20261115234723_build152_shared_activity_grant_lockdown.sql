/*
# Build 152: Lock down Activity table grants

1. Summary
- Removes the broad default table access that the platform grants to signed-in users on new tables.
- Re-grants only the access the app needs: read own Activity, mark its read state, and manage own preferences.

2. Security changes
- `activity_notifications`: all default privileges removed from PUBLIC, anon, authenticated and service_role. Re-granted SELECT to authenticated and UPDATE on read_at only.
- `activity_preferences`: all default privileges removed. Re-granted SELECT, plus INSERT and UPDATE on the on/off columns and updated_at only.

3. Notes
- No data is changed. Row level security policies from the previous step still decide which rows are visible.
*/

REVOKE ALL ON public.activity_notifications FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.activity_preferences FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON public.activity_notifications TO authenticated;
GRANT UPDATE (read_at) ON public.activity_notifications TO authenticated;

GRANT SELECT ON public.activity_preferences TO authenticated;
GRANT INSERT (profile_id, family_activity, circle_activity, prayer_activity, encouragement_activity, sermon_activity, updated_at) ON public.activity_preferences TO authenticated;
GRANT UPDATE (family_activity, circle_activity, prayer_activity, encouragement_activity, sermon_activity, updated_at) ON public.activity_preferences TO authenticated;
