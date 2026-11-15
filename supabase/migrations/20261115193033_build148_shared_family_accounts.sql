/*
# Build 148: Shared Family Accounts

1. Summary
- Adds a separate authenticated household membership model so more than one real SOLAPATH adult account can share one Family.
- Dependent/child profiles (family_members) are NOT changed and are NOT login accounts.
- Family content access moves from "owner account only" to "any current adult member of the household".

2. New tables
- family_account_memberships: one row per authenticated adult in a Family. Roles: OWNER or ADULT.
  One profile may belong to at most one Family. Each Family has at most one OWNER.
- family_invitations: single-use, revocable, optionally expiring codes (32 hex characters from 16 random bytes).

3. Modified tables
- family_profiles: owner-only policies replaced with member SELECT and owner UPDATE. Client INSERT and DELETE removed.
  Only family_name, memory_enabled and current_study are client-updatable. Owner foreign key becomes RESTRICT.
- family_members, family_walks, family_prayers, family_prayer_updates, family_journey_progress,
  catechism_progress, family_sermon_discussions: owner-only policies replaced with household-member policies.
- catechism_progress: user_id becomes nullable and references auth.users with ON DELETE SET NULL, so shared progress survives the original actor's deletion.
  New unique key on (family_profile_id, catechism_type, question_number).
- family_journey_progress: new unique key on (family_profile_id, pathway, lesson_number).

4. Security
- RLS enabled on both new tables. Memberships are readable only by the member themselves or co-members; invitations only by the Family owner.
- No client INSERT, UPDATE or DELETE on memberships or invitations. All changes go through SECURITY DEFINER RPCs that read auth.uid() and never accept an acting profile id.
- Helper functions live in the private schema, use a fixed empty search_path, and are executable by authenticated only.

5. Important notes
- Existing owners are backfilled as OWNER memberships. No Family, child profile, prayer, journey, catechism, walk or discussion data is modified or duplicated.
- One legacy Family row has no owner (profile_id is null). It is left untouched because no account can be assigned to it safely. Its profile_id remains nullable until that is resolved.
- Account deletion for an owner transfers ownership to the earliest-joined adult when one exists; otherwise the Family is deleted as before.
*/

-- ============================================================
-- 1. Private helper schema and membership helpers
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

-- ============================================================
-- 2. Family account memberships
-- ============================================================

CREATE TABLE IF NOT EXISTS public.family_account_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_profile_id uuid NOT NULL REFERENCES public.family_profiles(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('OWNER', 'ADULT')),
  invited_by_profile_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_account_memberships_family_profile_key UNIQUE (family_profile_id, profile_id),
  CONSTRAINT family_account_memberships_profile_key UNIQUE (profile_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS family_account_memberships_one_owner
  ON public.family_account_memberships (family_profile_id)
  WHERE role = 'OWNER';

CREATE INDEX IF NOT EXISTS idx_family_account_memberships_family_joined
  ON public.family_account_memberships (family_profile_id, joined_at);

ALTER TABLE public.family_account_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.family_account_memberships FROM anon, authenticated;
GRANT SELECT ON public.family_account_memberships TO authenticated;

CREATE OR REPLACE FUNCTION private.is_family_account_member(p_family_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_account_memberships AS m
    WHERE m.family_profile_id = p_family_profile_id
      AND m.profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION private.is_family_owner(p_family_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_account_memberships AS m
    WHERE m.family_profile_id = p_family_profile_id
      AND m.profile_id = auth.uid()
      AND m.role = 'OWNER'
  );
$$;

REVOKE ALL ON FUNCTION private.is_family_account_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_family_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_family_account_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_family_owner(uuid) TO authenticated;

DROP POLICY IF EXISTS "family_memberships_select_household" ON public.family_account_memberships;
CREATE POLICY "family_memberships_select_household" ON public.family_account_memberships
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR private.is_family_account_member(family_profile_id));

-- Backfill every existing Family owner as OWNER. Re-runnable.
INSERT INTO public.family_account_memberships (family_profile_id, profile_id, role)
SELECT fp.id, fp.profile_id, 'OWNER'
FROM public.family_profiles AS fp
WHERE fp.profile_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Family invitations
-- ============================================================

CREATE TABLE IF NOT EXISTS public.family_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_profile_id uuid NOT NULL REFERENCES public.family_profiles(id) ON DELETE CASCADE,
  created_by_profile_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  invite_code text NOT NULL UNIQUE CHECK (char_length(invite_code) = 32),
  expires_at timestamptz NULL,
  accepted_at timestamptz NULL,
  accepted_by_profile_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_invitations_family ON public.family_invitations (family_profile_id);

ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.family_invitations FROM anon, authenticated;
GRANT SELECT ON public.family_invitations TO authenticated;

CREATE OR REPLACE FUNCTION private.is_family_owner_of_invitation(p_family_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_family_owner(p_family_profile_id);
$$;

REVOKE ALL ON FUNCTION private.is_family_owner_of_invitation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_family_owner_of_invitation(uuid) TO authenticated;

DROP POLICY IF EXISTS "family_invitations_select_owner" ON public.family_invitations;
CREATE POLICY "family_invitations_select_owner" ON public.family_invitations
  FOR SELECT TO authenticated
  USING (private.is_family_owner(family_profile_id));

-- ============================================================
-- 4. Family profile ownership and RLS
-- ============================================================

ALTER TABLE public.family_profiles DROP CONSTRAINT IF EXISTS family_profiles_profile_id_fkey;
ALTER TABLE public.family_profiles
  ADD CONSTRAINT family_profiles_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

DROP POLICY IF EXISTS "select_own_family_profiles" ON public.family_profiles;
DROP POLICY IF EXISTS "insert_own_family_profiles" ON public.family_profiles;
DROP POLICY IF EXISTS "update_own_family_profiles" ON public.family_profiles;
DROP POLICY IF EXISTS "delete_own_family_profiles" ON public.family_profiles;

REVOKE ALL ON public.family_profiles FROM anon, authenticated;
GRANT SELECT ON public.family_profiles TO authenticated;
GRANT UPDATE (family_name, memory_enabled, current_study) ON public.family_profiles TO authenticated;

CREATE POLICY "family_profiles_select_household" ON public.family_profiles
  FOR SELECT TO authenticated
  USING (private.is_family_account_member(id));

CREATE POLICY "family_profiles_update_owner" ON public.family_profiles
  FOR UPDATE TO authenticated
  USING (private.is_family_owner(id))
  WITH CHECK (private.is_family_owner(id));

-- ============================================================
-- 5. Household-shared content RLS
-- ============================================================

DROP POLICY IF EXISTS "select_own_family_members" ON public.family_members;
DROP POLICY IF EXISTS "insert_own_family_members" ON public.family_members;
DROP POLICY IF EXISTS "update_own_family_members" ON public.family_members;
DROP POLICY IF EXISTS "delete_own_family_members" ON public.family_members;
CREATE POLICY "household_select_family_members" ON public.family_members
  FOR SELECT TO authenticated
  USING (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_insert_family_members" ON public.family_members
  FOR INSERT TO authenticated
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_update_family_members" ON public.family_members
  FOR UPDATE TO authenticated
  USING (private.is_family_account_member(family_profile_id))
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_delete_family_members" ON public.family_members
  FOR DELETE TO authenticated
  USING (private.is_family_account_member(family_profile_id));

DROP POLICY IF EXISTS "select_own_family_walks" ON public.family_walks;
DROP POLICY IF EXISTS "insert_own_family_walks" ON public.family_walks;
DROP POLICY IF EXISTS "update_own_family_walks" ON public.family_walks;
DROP POLICY IF EXISTS "delete_own_family_walks" ON public.family_walks;
CREATE POLICY "household_select_family_walks" ON public.family_walks
  FOR SELECT TO authenticated
  USING (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_insert_family_walks" ON public.family_walks
  FOR INSERT TO authenticated
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_update_family_walks" ON public.family_walks
  FOR UPDATE TO authenticated
  USING (private.is_family_account_member(family_profile_id))
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_delete_family_walks" ON public.family_walks
  FOR DELETE TO authenticated
  USING (private.is_family_account_member(family_profile_id));

DROP POLICY IF EXISTS "select_own_family_prayers" ON public.family_prayers;
DROP POLICY IF EXISTS "insert_own_family_prayers" ON public.family_prayers;
DROP POLICY IF EXISTS "update_own_family_prayers" ON public.family_prayers;
DROP POLICY IF EXISTS "delete_own_family_prayers" ON public.family_prayers;
CREATE POLICY "household_select_family_prayers" ON public.family_prayers
  FOR SELECT TO authenticated
  USING (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_insert_family_prayers" ON public.family_prayers
  FOR INSERT TO authenticated
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_update_family_prayers" ON public.family_prayers
  FOR UPDATE TO authenticated
  USING (private.is_family_account_member(family_profile_id))
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_delete_family_prayers" ON public.family_prayers
  FOR DELETE TO authenticated
  USING (private.is_family_account_member(family_profile_id));

DROP POLICY IF EXISTS "select_own_family_prayer_updates" ON public.family_prayer_updates;
DROP POLICY IF EXISTS "insert_own_family_prayer_updates" ON public.family_prayer_updates;
DROP POLICY IF EXISTS "update_own_family_prayer_updates" ON public.family_prayer_updates;
DROP POLICY IF EXISTS "delete_own_family_prayer_updates" ON public.family_prayer_updates;
CREATE POLICY "household_select_family_prayer_updates" ON public.family_prayer_updates
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.family_prayers AS fp
    WHERE fp.id = family_prayer_updates.family_prayer_id
      AND private.is_family_account_member(fp.family_profile_id)
  ));
CREATE POLICY "household_insert_family_prayer_updates" ON public.family_prayer_updates
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.family_prayers AS fp
    WHERE fp.id = family_prayer_updates.family_prayer_id
      AND private.is_family_account_member(fp.family_profile_id)
  ));
CREATE POLICY "household_update_family_prayer_updates" ON public.family_prayer_updates
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.family_prayers AS fp
    WHERE fp.id = family_prayer_updates.family_prayer_id
      AND private.is_family_account_member(fp.family_profile_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.family_prayers AS fp
    WHERE fp.id = family_prayer_updates.family_prayer_id
      AND private.is_family_account_member(fp.family_profile_id)
  ));
CREATE POLICY "household_delete_family_prayer_updates" ON public.family_prayer_updates
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.family_prayers AS fp
    WHERE fp.id = family_prayer_updates.family_prayer_id
      AND private.is_family_account_member(fp.family_profile_id)
  ));

DROP POLICY IF EXISTS "select_own_family_journey_progress" ON public.family_journey_progress;
DROP POLICY IF EXISTS "insert_own_family_journey_progress" ON public.family_journey_progress;
DROP POLICY IF EXISTS "update_own_family_journey_progress" ON public.family_journey_progress;
DROP POLICY IF EXISTS "delete_own_family_journey_progress" ON public.family_journey_progress;
CREATE POLICY "household_select_family_journey_progress" ON public.family_journey_progress
  FOR SELECT TO authenticated
  USING (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_insert_family_journey_progress" ON public.family_journey_progress
  FOR INSERT TO authenticated
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_update_family_journey_progress" ON public.family_journey_progress
  FOR UPDATE TO authenticated
  USING (private.is_family_account_member(family_profile_id))
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_delete_family_journey_progress" ON public.family_journey_progress
  FOR DELETE TO authenticated
  USING (private.is_family_account_member(family_profile_id));

DROP POLICY IF EXISTS "select_own_family_sermon_discussions" ON public.family_sermon_discussions;
DROP POLICY IF EXISTS "insert_own_family_sermon_discussions" ON public.family_sermon_discussions;
DROP POLICY IF EXISTS "update_own_family_sermon_discussions" ON public.family_sermon_discussions;
DROP POLICY IF EXISTS "delete_own_family_sermon_discussions" ON public.family_sermon_discussions;
CREATE POLICY "household_select_family_sermon_discussions" ON public.family_sermon_discussions
  FOR SELECT TO authenticated
  USING (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_insert_family_sermon_discussions" ON public.family_sermon_discussions
  FOR INSERT TO authenticated
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_update_family_sermon_discussions" ON public.family_sermon_discussions
  FOR UPDATE TO authenticated
  USING (private.is_family_account_member(family_profile_id))
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_delete_family_sermon_discussions" ON public.family_sermon_discussions
  FOR DELETE TO authenticated
  USING (private.is_family_account_member(family_profile_id));

-- ============================================================
-- 6. Catechism: household-shared progress
-- ============================================================

ALTER TABLE public.catechism_progress ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.catechism_progress DROP CONSTRAINT IF EXISTS catechism_progress_user_id_fkey;
ALTER TABLE public.catechism_progress
  ADD CONSTRAINT catechism_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS catechism_progress_household_question_key
  ON public.catechism_progress (family_profile_id, catechism_type, question_number);

DROP POLICY IF EXISTS "select_own_catechism_progress" ON public.catechism_progress;
DROP POLICY IF EXISTS "insert_own_catechism_progress" ON public.catechism_progress;
DROP POLICY IF EXISTS "update_own_catechism_progress" ON public.catechism_progress;
DROP POLICY IF EXISTS "delete_own_catechism_progress" ON public.catechism_progress;
CREATE POLICY "household_select_catechism_progress" ON public.catechism_progress
  FOR SELECT TO authenticated
  USING (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_insert_catechism_progress" ON public.catechism_progress
  FOR INSERT TO authenticated
  WITH CHECK (private.is_family_account_member(family_profile_id) AND user_id = auth.uid());
CREATE POLICY "household_update_catechism_progress" ON public.catechism_progress
  FOR UPDATE TO authenticated
  USING (private.is_family_account_member(family_profile_id))
  WITH CHECK (private.is_family_account_member(family_profile_id));
CREATE POLICY "household_delete_catechism_progress" ON public.catechism_progress
  FOR DELETE TO authenticated
  USING (private.is_family_account_member(family_profile_id));

-- ============================================================
-- 7. Family Journey: one shared progress row per lesson
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS family_journey_progress_household_lesson_key
  ON public.family_journey_progress (family_profile_id, pathway, lesson_number);

-- ============================================================
-- 8. Secure RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_family_profile(p_family_name text)
RETURNS public.family_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_membership public.family_account_memberships%ROWTYPE;
  v_family public.family_profiles%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  SELECT * INTO v_membership
  FROM public.family_account_memberships AS m
  WHERE m.profile_id = v_uid;

  IF FOUND THEN
    IF v_membership.role = 'OWNER' THEN
      SELECT * INTO v_family FROM public.family_profiles AS fp WHERE fp.id = v_membership.family_profile_id;
      RETURN v_family;
    END IF;
    RAISE EXCEPTION 'already_in_family' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.family_profiles (profile_id, family_name, memory_enabled)
  VALUES (v_uid, coalesce(nullif(btrim(p_family_name), ''), 'My Family'), true)
  RETURNING * INTO v_family;

  INSERT INTO public.family_account_memberships (family_profile_id, profile_id, role)
  VALUES (v_family.id, v_uid, 'OWNER');

  RETURN v_family;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_family_invitation(p_family_profile_id uuid, p_expires_in_hours integer)
RETURNS public.family_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invitation public.family_invitations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;
  IF p_expires_in_hours IS NOT NULL AND p_expires_in_hours NOT IN (24, 168) THEN
    RAISE EXCEPTION 'invalid_expiry' USING ERRCODE = 'P0001';
  END IF;
  IF NOT private.is_family_owner(p_family_profile_id) THEN
    RAISE EXCEPTION 'not_family_owner' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.family_invitations (family_profile_id, created_by_profile_id, invite_code, expires_at)
  VALUES (
    p_family_profile_id,
    v_uid,
    encode(extensions.gen_random_bytes(16), 'hex'),
    CASE WHEN p_expires_in_hours IS NULL THEN NULL ELSE now() + make_interval(hours => p_expires_in_hours) END
  )
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$;

CREATE OR REPLACE FUNCTION public.preview_family_invitation(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invitation public.family_invitations%ROWTYPE;
  v_family_name text;
  v_adult_count integer;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_invitation FROM public.family_invitations AS i WHERE i.invite_code = btrim(p_code);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT fp.family_name INTO v_family_name FROM public.family_profiles AS fp WHERE fp.id = v_invitation.family_profile_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT count(*) INTO v_adult_count FROM public.family_account_memberships AS m WHERE m.family_profile_id = v_invitation.family_profile_id;

  IF v_invitation.accepted_at IS NOT NULL THEN
    v_status := 'used';
  ELSIF v_invitation.revoked_at IS NOT NULL THEN
    v_status := 'revoked';
  ELSIF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at <= now() THEN
    v_status := 'expired';
  ELSIF EXISTS (SELECT 1 FROM public.family_account_memberships AS m WHERE m.profile_id = v_uid AND m.family_profile_id = v_invitation.family_profile_id) THEN
    v_status := 'already_member';
  ELSIF EXISTS (SELECT 1 FROM public.family_account_memberships AS m WHERE m.profile_id = v_uid) THEN
    v_status := 'already_in_family';
  ELSIF v_adult_count >= 6 THEN
    v_status := 'family_full';
  ELSE
    v_status := 'valid';
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'family_name', v_family_name,
    'expires_at', v_invitation.expires_at,
    'adult_count', v_adult_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_family_invitation(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invitation public.family_invitations%ROWTYPE;
  v_family_name text;
  v_adult_count integer;
  v_existing public.family_account_memberships%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  SELECT * INTO v_invitation FROM public.family_invitations AS i WHERE i.invite_code = btrim(p_code) FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_code' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_invitation.family_profile_id::text, 1));

  IF v_invitation.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_used' USING ERRCODE = 'P0001';
  END IF;
  IF v_invitation.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'revoked' USING ERRCODE = 'P0001';
  END IF;
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at <= now() THEN
    RAISE EXCEPTION 'expired' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_existing FROM public.family_account_memberships AS m WHERE m.profile_id = v_uid;
  IF FOUND THEN
    IF v_existing.family_profile_id = v_invitation.family_profile_id THEN
      RAISE EXCEPTION 'already_member' USING ERRCODE = 'P0001';
    END IF;
    RAISE EXCEPTION 'already_in_family' USING ERRCODE = 'P0001';
  END IF;

  SELECT fp.family_name INTO v_family_name FROM public.family_profiles AS fp WHERE fp.id = v_invitation.family_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'family_unavailable' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_adult_count FROM public.family_account_memberships AS m WHERE m.family_profile_id = v_invitation.family_profile_id;
  IF v_adult_count >= 6 THEN
    RAISE EXCEPTION 'family_full' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.family_account_memberships (family_profile_id, profile_id, role, invited_by_profile_id)
  VALUES (v_invitation.family_profile_id, v_uid, 'ADULT', v_invitation.created_by_profile_id);

  UPDATE public.family_invitations
  SET accepted_at = now(), accepted_by_profile_id = v_uid
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'status', 'joined',
    'family_profile_id', v_invitation.family_profile_id,
    'family_name', v_family_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_family_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invitation public.family_invitations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_invitation FROM public.family_invitations AS i WHERE i.id = p_invitation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF NOT private.is_family_owner(v_invitation.family_profile_id) THEN
    RAISE EXCEPTION 'not_family_owner' USING ERRCODE = 'P0001';
  END IF;
  IF v_invitation.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_accepted' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.family_invitations
  SET revoked_at = coalesce(revoked_at, now())
  WHERE id = v_invitation.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_family_adult(p_family_profile_id uuid, p_target_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_target public.family_account_memberships%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;
  IF NOT private.is_family_owner(p_family_profile_id) THEN
    RAISE EXCEPTION 'not_family_owner' USING ERRCODE = 'P0001';
  END IF;
  IF p_target_profile_id = v_uid THEN
    RAISE EXCEPTION 'cannot_remove_self' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_target
  FROM public.family_account_memberships AS m
  WHERE m.family_profile_id = p_family_profile_id AND m.profile_id = p_target_profile_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'member_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF v_target.role <> 'ADULT' THEN
    RAISE EXCEPTION 'cannot_remove_owner' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.family_account_memberships AS m WHERE m.id = v_target.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_family(p_family_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_membership public.family_account_memberships%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_membership
  FROM public.family_account_memberships AS m
  WHERE m.family_profile_id = p_family_profile_id AND m.profile_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_a_member' USING ERRCODE = 'P0001';
  END IF;
  IF v_membership.role = 'OWNER' THEN
    RAISE EXCEPTION 'owner_cannot_leave' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.family_account_memberships AS m WHERE m.id = v_membership.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_family_account_summaries(p_family_profile_id uuid)
RETURNS TABLE (profile_id uuid, display_name text, family_role text, joined_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    m.profile_id,
    coalesce(nullif(btrim(p.display_name), ''), 'SOLAPATH Member')::text AS display_name,
    m.role AS family_role,
    m.joined_at
  FROM public.family_account_memberships AS m
  JOIN public.profiles AS p ON p.id = m.profile_id
  WHERE m.family_profile_id = p_family_profile_id
    AND private.is_family_account_member(p_family_profile_id)
  ORDER BY (m.role = 'OWNER') DESC, m.joined_at ASC, m.profile_id ASC;
$$;

REVOKE ALL ON FUNCTION public.create_family_profile(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_family_invitation(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.preview_family_invitation(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_family_invitation(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_family_invitation(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_family_adult(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_family(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_family_account_summaries(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_family_profile(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_family_invitation(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.preview_family_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_family_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_family_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_family_adult(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_family(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_family_account_summaries(uuid) TO authenticated;

-- ============================================================
-- 9. Account deletion: keep shared Family intact
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_account_data(p_user_id uuid, p_app_version text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_membership public.family_account_memberships%ROWTYPE;
  v_successor uuid;
BEGIN
IF p_user_id IS NULL THEN
RAISE EXCEPTION 'user id is required';
END IF;

DELETE FROM public.legacy_events WHERE profile_id = p_user_id;
DELETE FROM public.legacy_life_seasons WHERE profile_id = p_user_id;
DELETE FROM public.legacy_letters WHERE profile_id = p_user_id;
DELETE FROM public.legacy_milestones WHERE profile_id = p_user_id;
DELETE FROM public.legacy_testimony WHERE profile_id = p_user_id;
DELETE FROM public.legacy_scripture_refs WHERE profile_id = p_user_id;
DELETE FROM public.legacy_year_reviews WHERE profile_id = p_user_id;
DELETE FROM public.legacy_designated_persons WHERE profile_id = p_user_id;

DELETE FROM public.ask_messages WHERE user_id = p_user_id;
DELETE FROM public.ask_conversations WHERE user_id = p_user_id;
DELETE FROM public.memories WHERE user_id = p_user_id;
DELETE FROM public.prayer_sessions WHERE user_id = p_user_id;
DELETE FROM public.prayer_updates WHERE user_id = p_user_id;
DELETE FROM public.prayers WHERE user_id = p_user_id;
DELETE FROM public.walk_reflections WHERE user_id = p_user_id;
DELETE FROM public.walks WHERE user_id = p_user_id;
DELETE FROM public.daily_checkins WHERE user_id = p_user_id;
DELETE FROM public.ai_usage_log WHERE user_id = p_user_id OR session_id = p_user_id::text;
DELETE FROM public.rate_limit_buckets WHERE identifier = p_user_id::text;
DELETE FROM public.theological_concern_reports WHERE user_id = p_user_id;

DELETE FROM public.bible_notes WHERE user_id = p_user_id;
DELETE FROM public.bible_chapter_notes WHERE user_id = p_user_id;
DELETE FROM public.bible_highlights WHERE user_id = p_user_id;
DELETE FROM public.bible_keyword_marks WHERE user_id = p_user_id;
DELETE FROM public.bible_keywords WHERE user_id = p_user_id;
DELETE FROM public.bible_bookmarks WHERE user_id = p_user_id;
DELETE FROM public.bible_reading_history WHERE user_id = p_user_id;

DELETE FROM public.reach_prayer_updates WHERE user_id = p_user_id;
DELETE FROM public.reach_conversations WHERE user_id = p_user_id;
DELETE FROM public.reach_people WHERE user_id = p_user_id;
DELETE FROM public.prodigal_updates WHERE user_id = p_user_id;
DELETE FROM public.prodigal_journey WHERE user_id = p_user_id;
DELETE FROM public.conversation_practice WHERE user_id = p_user_id;
DELETE FROM public.catechism_progress WHERE user_id = p_user_id AND family_profile_id IS NULL;

DELETE FROM public.sermon_notes WHERE profile_id = p_user_id;
DELETE FROM public.sermons WHERE user_id = p_user_id;
DELETE FROM public.church_admin_claims WHERE profile_id = p_user_id;
DELETE FROM public.church_memberships WHERE profile_id = p_user_id;
UPDATE public.church_profiles SET user_id = NULL, source = 'released' WHERE user_id = p_user_id;

DELETE FROM public.circle_check_ins WHERE user_id = p_user_id OR profile_id = p_user_id;
DELETE FROM public.encouragements WHERE user_id = p_user_id;
DELETE FROM public.prayer_acknowledgements WHERE user_id = p_user_id OR profile_id = p_user_id;
DELETE FROM public.group_discussions WHERE user_id = p_user_id OR profile_id = p_user_id;
DELETE FROM public.shared_reflections WHERE profile_id = p_user_id;
DELETE FROM public.shared_scripture_studies WHERE user_id = p_user_id;
DELETE FROM public.shared_prayers WHERE profile_id = p_user_id;
DELETE FROM public.circle_invitations WHERE invited_by_profile_id = p_user_id;
DELETE FROM public.circle_members WHERE profile_id = p_user_id;
DELETE FROM public.accountability_relationships WHERE profile_id = p_user_id;

SELECT * INTO v_membership FROM public.family_account_memberships WHERE profile_id = p_user_id;
IF FOUND AND v_membership.role = 'OWNER' THEN
  SELECT m.profile_id INTO v_successor
  FROM public.family_account_memberships AS m
  WHERE m.family_profile_id = v_membership.family_profile_id
    AND m.role = 'ADULT'
    AND m.profile_id <> p_user_id
  ORDER BY m.joined_at ASC, m.profile_id ASC
  LIMIT 1;

  IF v_successor IS NULL THEN
    DELETE FROM public.family_profiles WHERE id = v_membership.family_profile_id;
  ELSE
    DELETE FROM public.family_account_memberships WHERE id = v_membership.id;
    UPDATE public.family_account_memberships
    SET role = 'OWNER'
    WHERE family_profile_id = v_membership.family_profile_id AND profile_id = v_successor;
    UPDATE public.family_profiles
    SET profile_id = v_successor, updated_at = now()
    WHERE id = v_membership.family_profile_id;
  END IF;
END IF;

DELETE FROM public.family_account_memberships WHERE profile_id = p_user_id;

DELETE FROM public.life_stages WHERE profile_id = p_user_id;
DELETE FROM public.life_areas WHERE profile_id = p_user_id;
DELETE FROM public.growth_areas WHERE profile_id = p_user_id;
DELETE FROM public.current_studies WHERE profile_id = p_user_id;

DELETE FROM public.notification_preferences WHERE profile_id = p_user_id;
DELETE FROM public.beta_feedback WHERE profile_id = p_user_id;

DELETE FROM public.profiles WHERE id = p_user_id;

INSERT INTO public.account_deletion_audit (event, app_version)
VALUES ('account_deletion', left(coalesce(nullif(trim(p_app_version), ''), 'unknown'), 32));
END;
$function$;
