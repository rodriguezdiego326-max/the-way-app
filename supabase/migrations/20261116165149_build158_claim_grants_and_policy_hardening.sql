/*
# Build 158 — claim grants and policy hardening

Allows authenticated members to create and withdraw their own church-role claims while
RLS still enforces ownership and pastor-evidence requirements. Also adds indexes and
uses initPlan-friendly auth.uid() calls in the touched policies.
*/

GRANT INSERT, UPDATE ON public.church_admin_claims TO authenticated;

CREATE INDEX IF NOT EXISTS idx_church_admin_claims_pastor_verified_by
  ON public.church_admin_claims (pastor_verified_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_church_admin_claims_reviewed_by
  ON public.church_admin_claims (reviewed_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_church_groups_church_id
  ON public.church_groups (church_id);

DROP POLICY IF EXISTS select_own_church_admin_claims ON public.church_admin_claims;
CREATE POLICY select_own_church_admin_claims
ON public.church_admin_claims
FOR SELECT
TO authenticated
USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS withdraw_own_pending_church_admin_claims ON public.church_admin_claims;
CREATE POLICY withdraw_own_pending_church_admin_claims
ON public.church_admin_claims
FOR UPDATE
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  AND status = 'pending'
)
WITH CHECK (
  profile_id = (SELECT auth.uid())
  AND status = 'withdrawn'
);

DROP POLICY IF EXISTS select_church_groups ON public.church_groups;
CREATE POLICY select_church_groups
ON public.church_groups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = church_groups.church_id
      AND cm.profile_id = (SELECT auth.uid())
  )
);
