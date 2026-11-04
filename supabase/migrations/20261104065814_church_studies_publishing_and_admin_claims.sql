/*
# Church studies publishing and church admin claims (Build 113)

1. Plain-English summary
- Members can request a verified church administration role (CHURCH_ADMIN, PASTOR, ELDER, LEADER) for a church they belong to.
- Only a service-role operation can approve or reject a claim. Approval sets verified_church_role on that member's membership.
- Published church studies are visible to members of that church. Drafts and archived studies are visible only to verified publishers of that church.
- Studies move through draft, published, archived through one publisher-checked function. Studies are archived, never silently deleted.

2. New table: church_admin_claims
- id, profile_id (defaults to the caller), church_id, requested_role, status (pending, approved, rejected, withdrawn), created_at, updated_at, reviewed_at, reviewed_by_profile_id.
- At most one pending claim per profile and church.

3. Changed table: church_studies
- status (draft, published, archived; default draft). Existing rows become draft, so nothing becomes visible by accident.
- published_at, published_by_profile_id (ON DELETE SET NULL so deleting a publisher keeps the study), updated_at.

4. Changed table: church_study_assignments
- sort_order (default 0), updated_at.

5. Security
- RLS enabled on church_admin_claims. Callers can create a claim only for themselves and a church they belong to, read their own claims, and withdraw their own pending claim. Review fields are not granted to them.
- Owner-based study policies are replaced with verified-publisher and member checks. No study DELETE is granted.
- Column-level grants: study and assignment writes are limited to content columns. Status and publishing fields change only through set_church_study_status().
- review_church_admin_claim() is executable only by service_role and checks the caller's JWT role.
- Helper predicates and status function use a pinned empty search_path, and PUBLIC and anon are revoked.

6. Important notes
- Church studies are church content. They are not part of the SOLAPATH Verified Library and are not used by global search or AI retrieval.
- Account deletion behavior is updated in a separate migration.
*/

ALTER TABLE public.church_studies
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_studies_status_check') THEN
    ALTER TABLE public.church_studies ADD CONSTRAINT church_studies_status_check CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_studies_published_at_required') THEN
    ALTER TABLE public.church_studies ADD CONSTRAINT church_studies_published_at_required CHECK (status <> 'published' OR published_at IS NOT NULL);
  END IF;
END $$;

ALTER TABLE public.church_study_assignments
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_church_studies_church_status ON public.church_studies (church_id, status);
CREATE INDEX IF NOT EXISTS idx_church_study_assignments_order ON public.church_study_assignments (church_study_id, sort_order);

CREATE TABLE IF NOT EXISTS public.church_admin_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.church_profiles(id) ON DELETE CASCADE,
  requested_role text NOT NULL CHECK (requested_role IN ('CHURCH_ADMIN', 'PASTOR', 'ELDER', 'LEADER')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS church_admin_claims_one_pending
  ON public.church_admin_claims (profile_id, church_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_church_admin_claims_church ON public.church_admin_claims (church_id);

CREATE OR REPLACE FUNCTION public.touch_church_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_church_admin_claims_updated_at ON public.church_admin_claims;
CREATE TRIGGER touch_church_admin_claims_updated_at BEFORE UPDATE ON public.church_admin_claims
  FOR EACH ROW EXECUTE FUNCTION public.touch_church_content_updated_at();
DROP TRIGGER IF EXISTS touch_church_studies_updated_at ON public.church_studies;
CREATE TRIGGER touch_church_studies_updated_at BEFORE UPDATE ON public.church_studies
  FOR EACH ROW EXECUTE FUNCTION public.touch_church_content_updated_at();
DROP TRIGGER IF EXISTS touch_church_study_assignments_updated_at ON public.church_study_assignments;
CREATE TRIGGER touch_church_study_assignments_updated_at BEFORE UPDATE ON public.church_study_assignments
  FOR EACH ROW EXECUTE FUNCTION public.touch_church_content_updated_at();

CREATE OR REPLACE FUNCTION public.is_church_member(p_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.church_memberships cm
    WHERE cm.church_id = p_church_id AND cm.profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_church_publisher(p_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.church_memberships cm
    WHERE cm.church_id = p_church_id
      AND cm.profile_id = auth.uid()
      AND cm.verified_church_role IN ('CHURCH_ADMIN', 'PASTOR', 'ELDER', 'LEADER')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_church_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_church_member(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_verified_church_publisher(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_verified_church_publisher(uuid) TO authenticated;

ALTER TABLE public.church_admin_claims ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.church_admin_claims FROM anon, authenticated;
GRANT SELECT ON public.church_admin_claims TO authenticated;
GRANT INSERT (church_id, requested_role) ON public.church_admin_claims TO authenticated;
GRANT UPDATE (status) ON public.church_admin_claims TO authenticated;
GRANT ALL ON public.church_admin_claims TO service_role;

DROP POLICY IF EXISTS "select_own_church_admin_claims" ON public.church_admin_claims;
CREATE POLICY "select_own_church_admin_claims" ON public.church_admin_claims FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_church_admin_claims" ON public.church_admin_claims;
CREATE POLICY "insert_own_church_admin_claims" ON public.church_admin_claims FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.church_memberships cm
    WHERE cm.church_id = church_admin_claims.church_id AND cm.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "withdraw_own_pending_church_admin_claims" ON public.church_admin_claims;
CREATE POLICY "withdraw_own_pending_church_admin_claims" ON public.church_admin_claims FOR UPDATE
TO authenticated
USING (profile_id = auth.uid() AND status = 'pending')
WITH CHECK (profile_id = auth.uid() AND status = 'withdrawn');

CREATE OR REPLACE FUNCTION public.review_church_admin_claim(p_claim_id uuid, p_decision text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_claim public.church_admin_claims%ROWTYPE;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  SELECT * INTO v_claim FROM public.church_admin_claims
  WHERE id = p_claim_id AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim is not pending';
  END IF;

  IF p_decision = 'approved' THEN
    UPDATE public.church_memberships
    SET verified_church_role = v_claim.requested_role
    WHERE profile_id = v_claim.profile_id AND church_id = v_claim.church_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Claimant is not a member of this church';
    END IF;
  END IF;

  UPDATE public.church_admin_claims
  SET status = p_decision, reviewed_at = now()
  WHERE id = p_claim_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_church_admin_claim(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_church_admin_claim(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.set_church_study_status(p_study_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_church_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  IF p_status NOT IN ('draft', 'published', 'archived') THEN
    RAISE EXCEPTION 'Invalid study status';
  END IF;

  SELECT cs.church_id INTO v_church_id FROM public.church_studies cs WHERE cs.id = p_study_id;
  IF v_church_id IS NULL OR NOT public.is_verified_church_publisher(v_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.church_studies
  SET status = p_status,
      published_at = CASE WHEN p_status = 'published' THEN now() ELSE published_at END,
      published_by_profile_id = CASE WHEN p_status = 'published' THEN auth.uid() ELSE published_by_profile_id END
  WHERE id = p_study_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_church_study_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_church_study_status(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "select_church_studies" ON public.church_studies;
DROP POLICY IF EXISTS "insert_church_studies" ON public.church_studies;
DROP POLICY IF EXISTS "update_church_studies" ON public.church_studies;
DROP POLICY IF EXISTS "delete_church_studies" ON public.church_studies;

REVOKE ALL ON public.church_studies FROM authenticated;
GRANT SELECT ON public.church_studies TO authenticated;
GRANT INSERT (church_id, title, description) ON public.church_studies TO authenticated;
GRANT UPDATE (title, description) ON public.church_studies TO authenticated;

CREATE POLICY "select_church_studies" ON public.church_studies FOR SELECT
TO authenticated
USING (
  public.is_verified_church_publisher(church_id)
  OR (status = 'published' AND public.is_church_member(church_id))
);

CREATE POLICY "insert_church_studies" ON public.church_studies FOR INSERT
TO authenticated
WITH CHECK (public.is_verified_church_publisher(church_id));

CREATE POLICY "update_church_studies" ON public.church_studies FOR UPDATE
TO authenticated
USING (public.is_verified_church_publisher(church_id))
WITH CHECK (public.is_verified_church_publisher(church_id));

DROP POLICY IF EXISTS "select_church_study_assignments" ON public.church_study_assignments;
DROP POLICY IF EXISTS "insert_church_study_assignments" ON public.church_study_assignments;
DROP POLICY IF EXISTS "update_church_study_assignments" ON public.church_study_assignments;
DROP POLICY IF EXISTS "delete_church_study_assignments" ON public.church_study_assignments;

REVOKE ALL ON public.church_study_assignments FROM authenticated;
GRANT SELECT ON public.church_study_assignments TO authenticated;
GRANT INSERT (church_study_id, week_label, passage_reference, reading_objective, discussion_questions, prayer_focus, meeting_date, sort_order) ON public.church_study_assignments TO authenticated;
GRANT UPDATE (week_label, passage_reference, reading_objective, discussion_questions, prayer_focus, meeting_date, sort_order) ON public.church_study_assignments TO authenticated;
GRANT DELETE ON public.church_study_assignments TO authenticated;

CREATE POLICY "select_church_study_assignments" ON public.church_study_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.church_studies cs
    WHERE cs.id = church_study_assignments.church_study_id
      AND (
        public.is_verified_church_publisher(cs.church_id)
        OR (cs.status = 'published' AND public.is_church_member(cs.church_id))
      )
  )
);

CREATE POLICY "insert_church_study_assignments" ON public.church_study_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.church_studies cs
    WHERE cs.id = church_study_assignments.church_study_id
      AND public.is_verified_church_publisher(cs.church_id)
  )
);

CREATE POLICY "update_church_study_assignments" ON public.church_study_assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.church_studies cs
    WHERE cs.id = church_study_assignments.church_study_id
      AND public.is_verified_church_publisher(cs.church_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.church_studies cs
    WHERE cs.id = church_study_assignments.church_study_id
      AND public.is_verified_church_publisher(cs.church_id)
  )
);

CREATE POLICY "delete_church_study_assignments" ON public.church_study_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.church_studies cs
    WHERE cs.id = church_study_assignments.church_study_id
      AND public.is_verified_church_publisher(cs.church_id)
  )
);
