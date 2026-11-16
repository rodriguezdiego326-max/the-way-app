/*
# Build 156 — App Admin Church Study Deletion

- App Owners and App Admins can list every church study through an admin-checked RPC.
- App Owners and App Admins can permanently delete a church study.
- Deleting a study cascades only to church_study_assignments through the existing foreign key.
- Every admin deletion is recorded in a private audit table before the study is removed.
- Normal church publishers still cannot delete studies directly.
*/

CREATE TABLE IF NOT EXISTS private.church_study_delete_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_study_id uuid NOT NULL,
  church_id uuid REFERENCES public.church_profiles(id) ON DELETE SET NULL,
  church_name text NOT NULL,
  study_title text NOT NULL,
  study_status text NOT NULL,
  assignment_count integer NOT NULL DEFAULT 0,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE private.church_study_delete_audit FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_church_study_delete_audit_actor
  ON private.church_study_delete_audit (actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_church_study_delete_audit_church
  ON private.church_study_delete_audit (church_id);
CREATE INDEX IF NOT EXISTS idx_church_study_delete_audit_deleted_at
  ON private.church_study_delete_audit (deleted_at DESC);

CREATE OR REPLACE FUNCTION public.list_church_studies_for_admin()
RETURNS TABLE (
  study_id uuid,
  church_id uuid,
  church_name text,
  church_city text,
  title text,
  description text,
  status text,
  updated_at timestamptz,
  assignment_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    cs.id,
    cs.church_id,
    cp.name,
    cp.city,
    cs.title,
    cs.description,
    cs.status,
    cs.updated_at,
    count(csa.id)::bigint
  FROM public.church_studies cs
  JOIN public.church_profiles cp ON cp.id = cs.church_id
  LEFT JOIN public.church_study_assignments csa ON csa.church_study_id = cs.id
  GROUP BY cs.id, cs.church_id, cp.name, cp.city, cs.title, cs.description, cs.status, cs.updated_at
  ORDER BY cs.updated_at DESC, cs.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_church_studies_for_admin()
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.list_church_studies_for_admin()
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_church_study(p_study_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_study public.church_studies%ROWTYPE;
  v_church_name text;
  v_assignment_count integer;
BEGIN
  IF v_actor IS NULL OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT cs.*
  INTO v_study
  FROM public.church_studies cs
  WHERE cs.id = p_study_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Study not found';
  END IF;

  SELECT cp.name
  INTO v_church_name
  FROM public.church_profiles cp
  WHERE cp.id = v_study.church_id;

  SELECT count(*)::integer
  INTO v_assignment_count
  FROM public.church_study_assignments csa
  WHERE csa.church_study_id = v_study.id;

  INSERT INTO private.church_study_delete_audit (
    actor_profile_id,
    deleted_study_id,
    church_id,
    church_name,
    study_title,
    study_status,
    assignment_count
  )
  VALUES (
    v_actor,
    v_study.id,
    v_study.church_id,
    coalesce(v_church_name, 'Unknown church'),
    v_study.title,
    v_study.status,
    v_assignment_count
  );

  DELETE FROM public.church_studies
  WHERE id = v_study.id;

  RETURN jsonb_build_object(
    'deleted', true,
    'study_id', v_study.id,
    'title', v_study.title,
    'church_id', v_study.church_id,
    'status', v_study.status,
    'assignments_deleted', v_assignment_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_church_study(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_church_study(uuid)
  TO authenticated;
