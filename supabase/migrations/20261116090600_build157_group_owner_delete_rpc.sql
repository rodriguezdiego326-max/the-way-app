/*
# Build 157 — Harden church small-group creator deletion

The client may need to delete a group it created even when the church directory entry is
ownerless or the creator does not satisfy the broader church-groups SELECT policy.

This authenticated RPC locks the target row, verifies that the caller is either the
recorded group leader/creator or the current church owner, and only then deletes it.
Related group discussions continue to be removed by the existing ON DELETE CASCADE FK.
*/

CREATE OR REPLACE FUNCTION public.delete_owned_church_group(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_group public.church_groups%ROWTYPE;
  v_is_church_owner boolean;
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

  SELECT EXISTS (
    SELECT 1
    FROM public.church_profiles cp
    WHERE cp.id = v_group.church_id
      AND cp.user_id = v_uid
  )
  INTO v_is_church_owner;

  IF v_group.leader_profile_id IS DISTINCT FROM v_uid
     AND NOT v_is_church_owner THEN
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
