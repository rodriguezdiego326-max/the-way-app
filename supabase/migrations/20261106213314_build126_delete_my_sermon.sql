/*
# Build 126: Delete my sermon notes (user-scoped, race-safe)

1. New function
- `public.delete_my_sermon(p_sermon_id uuid)` returns a small summary (number of your notes removed, whether the sermon record was removed).

2. What it does
- Deletes ONLY the calling user's sermon_notes rows for that sermon (matched on auth.uid() = profile_id).
- Never touches notes written by other users.
- Locks the sermon row (SELECT ... FOR UPDATE) so that a concurrent note insert by another user cannot slip in between the check and the delete.
- Removes the sermon record only when BOTH are true:
  a. no notes from any user remain on it, and
  b. the caller is the sermon's owner (sermons.user_id = auth.uid()), matching the existing sermon delete rule.
- Calling it again for an already-removed sermon is a no-op that reports nothing deleted.

3. Security changes
- No existing table policy is changed or weakened.
- Function is SECURITY DEFINER with a fixed search_path so it can see other users' notes to check whether any remain, but it only ever deletes rows tied to the caller's own id.
- EXECUTE revoked from PUBLIC and anon; granted to authenticated only.
- Requires a signed-in session; raises an error otherwise.

4. Notes
- No schema change, no new columns, no ownership backfill.
*/

CREATE OR REPLACE FUNCTION public.delete_my_sermon(p_sermon_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_deleted_notes integer := 0;
  v_deleted_sermon boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT s.user_id INTO v_owner FROM public.sermons s WHERE s.id = p_sermon_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('deleted_notes', 0, 'sermon_deleted', true);
  END IF;

  DELETE FROM public.sermon_notes
  WHERE sermon_id = p_sermon_id AND profile_id = v_uid;
  GET DIAGNOSTICS v_deleted_notes = ROW_COUNT;

  IF v_owner = v_uid AND NOT EXISTS (
    SELECT 1 FROM public.sermon_notes WHERE sermon_id = p_sermon_id
  ) THEN
    DELETE FROM public.sermons WHERE id = p_sermon_id;
    v_deleted_sermon := true;
  END IF;

  RETURN jsonb_build_object('deleted_notes', v_deleted_notes, 'sermon_deleted', v_deleted_sermon);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_my_sermon(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_sermon(uuid) TO authenticated;
