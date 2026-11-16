-- Build 159: Pastor-only Studies + Private Small Groups + English/Spanish + New User Guide

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS app_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS guide_completed_at timestamptz;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.profiles'::regclass
      AND conname='profiles_app_language_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_app_language_check;
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_app_language_check
    CHECK (app_language IN ('en','es'));
END $$;

UPDATE public.profiles
SET guide_completed_at = COALESCE(guide_completed_at, now())
WHERE onboarding_completed = true
  AND guide_completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.is_verified_church_publisher(p_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = p_church_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.verified_church_role = 'PASTOR'
  );
$$;

GRANT INSERT, UPDATE ON public.church_studies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.church_study_assignments TO authenticated;

CREATE INDEX IF NOT EXISTS idx_church_studies_published_by
  ON public.church_studies(published_by_profile_id);

CREATE OR REPLACE FUNCTION private.is_verified_church_leadership(check_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = check_church_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.verified_church_role IN ('PASTOR','CHURCH_ADMIN','ELDER','LEADER')
  );
$$;

REVOKE EXECUTE ON FUNCTION private.is_verified_church_leadership(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_verified_church_leadership(uuid)
  TO authenticated;

CREATE TABLE IF NOT EXISTS public.church_group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.church_groups(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'joined' CHECK (status IN ('joined')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, profile_id)
);

ALTER TABLE public.church_group_memberships ENABLE ROW LEVEL SECURITY;

GRANT SELECT, DELETE ON public.church_group_memberships TO authenticated;
REVOKE INSERT, UPDATE ON public.church_group_memberships FROM authenticated, anon;

CREATE INDEX IF NOT EXISTS idx_church_group_memberships_profile
  ON public.church_group_memberships(profile_id, group_id);
CREATE INDEX IF NOT EXISTS idx_church_group_memberships_group
  ON public.church_group_memberships(group_id, profile_id);

CREATE TABLE IF NOT EXISTS private.church_group_invites (
  group_id uuid PRIMARY KEY REFERENCES public.church_groups(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz
);

REVOKE ALL ON TABLE private.church_group_invites
  FROM PUBLIC, anon, authenticated;

INSERT INTO public.church_group_memberships (group_id, profile_id)
SELECT cg.id, cg.leader_profile_id
FROM public.church_groups cg
WHERE cg.leader_profile_id IS NOT NULL
ON CONFLICT (group_id, profile_id) DO NOTHING;

INSERT INTO private.church_group_invites (group_id, invite_code)
SELECT
  cg.id,
  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
FROM public.church_groups cg
ON CONFLICT (group_id) DO NOTHING;

CREATE OR REPLACE FUNCTION private.can_view_church_group(check_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_groups cg
    WHERE cg.id = check_group_id
      AND (
        cg.leader_profile_id = (SELECT auth.uid())
        OR private.is_verified_church_leadership(cg.church_id)
        OR EXISTS (
          SELECT 1
          FROM public.church_group_memberships cgm
          WHERE cgm.group_id = cg.id
            AND cgm.profile_id = (SELECT auth.uid())
            AND cgm.status = 'joined'
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION private.can_view_church_group(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_view_church_group(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION private.bootstrap_church_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.leader_profile_id IS NOT NULL THEN
    INSERT INTO public.church_group_memberships(group_id, profile_id)
    VALUES (NEW.id, NEW.leader_profile_id)
    ON CONFLICT (group_id, profile_id) DO NOTHING;
  END IF;

  INSERT INTO private.church_group_invites(group_id, invite_code)
  VALUES (
    NEW.id,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  ON CONFLICT (group_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.bootstrap_church_group()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bootstrap_church_group ON public.church_groups;
CREATE TRIGGER trg_bootstrap_church_group
AFTER INSERT ON public.church_groups
FOR EACH ROW
EXECUTE FUNCTION private.bootstrap_church_group();

DROP POLICY IF EXISTS select_church_groups ON public.church_groups;
CREATE POLICY select_church_groups
ON public.church_groups
FOR SELECT
TO authenticated
USING (
  leader_profile_id = (SELECT auth.uid())
  OR private.is_verified_church_leadership(church_id)
  OR EXISTS (
    SELECT 1
    FROM public.church_group_memberships cgm
    WHERE cgm.group_id = church_groups.id
      AND cgm.profile_id = (SELECT auth.uid())
      AND cgm.status = 'joined'
  )
);

DROP POLICY IF EXISTS insert_church_groups ON public.church_groups;
CREATE POLICY insert_church_groups
ON public.church_groups
FOR INSERT
TO authenticated
WITH CHECK (
  private.is_verified_church_leadership(church_id)
  AND leader_profile_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS update_church_groups ON public.church_groups;
CREATE POLICY update_church_groups
ON public.church_groups
FOR UPDATE
TO authenticated
USING (private.is_verified_church_leadership(church_id))
WITH CHECK (private.is_verified_church_leadership(church_id));

DROP POLICY IF EXISTS delete_owned_church_groups ON public.church_groups;
CREATE POLICY delete_owned_church_groups
ON public.church_groups
FOR DELETE
TO authenticated
USING (leader_profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS select_church_group_memberships ON public.church_group_memberships;
CREATE POLICY select_church_group_memberships
ON public.church_group_memberships
FOR SELECT
TO authenticated
USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS delete_own_church_group_memberships ON public.church_group_memberships;
CREATE POLICY delete_own_church_group_memberships
ON public.church_group_memberships
FOR DELETE
TO authenticated
USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS select_own_group_discussions ON public.group_discussions;
DROP POLICY IF EXISTS insert_own_group_discussions ON public.group_discussions;
DROP POLICY IF EXISTS update_own_group_discussions ON public.group_discussions;
DROP POLICY IF EXISTS delete_own_group_discussions ON public.group_discussions;
DROP POLICY IF EXISTS select_visible_group_discussions ON public.group_discussions;
DROP POLICY IF EXISTS insert_visible_group_discussions ON public.group_discussions;
DROP POLICY IF EXISTS update_own_visible_group_discussions ON public.group_discussions;
DROP POLICY IF EXISTS delete_own_visible_group_discussions ON public.group_discussions;

CREATE POLICY select_visible_group_discussions
ON public.group_discussions
FOR SELECT
TO authenticated
USING (private.can_view_church_group(group_id));

CREATE POLICY insert_visible_group_discussions
ON public.group_discussions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND private.can_view_church_group(group_id)
);

CREATE POLICY update_own_visible_group_discussions
ON public.group_discussions
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND private.can_view_church_group(group_id)
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND private.can_view_church_group(group_id)
);

CREATE POLICY delete_own_visible_group_discussions
ON public.group_discussions
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND private.can_view_church_group(group_id)
);

CREATE OR REPLACE FUNCTION public.join_church_group_by_code(p_invite_code text)
RETURNS TABLE (
  group_id uuid,
  group_name text,
  church_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_group_id uuid;
  v_group_name text;
  v_church_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cg.id, cg.name, cg.church_id
  INTO v_group_id, v_group_name, v_church_id
  FROM private.church_group_invites cgi
  JOIN public.church_groups cg ON cg.id = cgi.group_id
  WHERE cgi.invite_code = upper(btrim(p_invite_code))
  LIMIT 1;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.profile_id = v_uid
      AND cm.church_id = v_church_id
  ) THEN
    RAISE EXCEPTION 'You must belong to this church before joining the group';
  END IF;

  INSERT INTO public.church_group_memberships(group_id, profile_id)
  VALUES (v_group_id, v_uid)
  ON CONFLICT ON CONSTRAINT church_group_memberships_group_id_profile_id_key
  DO NOTHING;

  RETURN QUERY SELECT v_group_id, v_group_name, v_church_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_church_group_by_code(text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.join_church_group_by_code(text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_church_group_invite_code(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_church_id uuid;
  v_leader uuid;
  v_code text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cg.church_id, cg.leader_profile_id
  INTO v_church_id, v_leader
  FROM public.church_groups cg
  WHERE cg.id = p_group_id;

  IF v_church_id IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  IF v_leader IS DISTINCT FROM v_uid
     AND NOT private.is_verified_church_leadership(v_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT cgi.invite_code
  INTO v_code
  FROM private.church_group_invites cgi
  WHERE cgi.group_id = p_group_id;

  RETURN v_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_church_group_invite_code(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_church_group_invite_code(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.rotate_church_group_invite_code(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_church_id uuid;
  v_leader uuid;
  v_code text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cg.church_id, cg.leader_profile_id
  INTO v_church_id, v_leader
  FROM public.church_groups cg
  WHERE cg.id = p_group_id;

  IF v_church_id IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  IF v_leader IS DISTINCT FROM v_uid
     AND NOT private.is_verified_church_leadership(v_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE private.church_group_invites
  SET invite_code = v_code,
      rotated_at = now()
  WHERE group_id = p_group_id;

  RETURN v_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rotate_church_group_invite_code(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.rotate_church_group_invite_code(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_owned_church_group(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_group public.church_groups%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cg.*
  INTO v_group
  FROM public.church_groups cg
  WHERE cg.id = p_group_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('deleted', false, 'reason', 'not_found');
  END IF;

  IF v_group.leader_profile_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.church_groups
  WHERE id = v_group.id;

  RETURN jsonb_build_object(
    'deleted', true,
    'group_id', v_group.id,
    'church_id', v_group.church_id,
    'name', v_group.name
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_owned_church_group(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.delete_owned_church_group(uuid)
  TO authenticated;
