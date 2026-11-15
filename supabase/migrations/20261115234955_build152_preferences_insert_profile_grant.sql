/*
# Allow preference rows to be created with the owner's profile id

1. Modified grants
- activity_preferences: INSERT is granted on the profile_id column to authenticated.

2. Why
- The app saves preferences with an upsert keyed on profile_id. Without this column grant, the first save fails with a permission error even though the row would pass the owner check.

3. Security
- The existing insert policy still requires profile_id = auth.uid(), so a user can only create their own preference row.
*/

GRANT INSERT (profile_id) ON public.activity_preferences TO authenticated;
