/*
# Build 157 — Group creator deletion

Church small groups can be deleted by the profile recorded as the group's leader/creator,
or by the current owner of the church profile. Existing discussion rows are removed by
the existing ON DELETE CASCADE foreign key.

Together Circles already have an owner-only DELETE policy and all Circle-scoped data
already cascades when the Circle is deleted, so no Circle schema change is required.
*/

DROP POLICY IF EXISTS "delete_church_groups" ON public.church_groups;

CREATE POLICY "delete_owned_church_groups"
ON public.church_groups
FOR DELETE
TO authenticated
USING (
  leader_profile_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.church_profiles cp
    WHERE cp.id = church_groups.church_id
      AND cp.user_id = (SELECT auth.uid())
  )
);
