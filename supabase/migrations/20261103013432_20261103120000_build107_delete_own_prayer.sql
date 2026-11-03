/*
# Build 107: delete one of the signed-in user's prayers

1. What changes
- Adds the function `delete_own_prayer(p_prayer_id uuid)`.
- The function permanently deletes one prayer that belongs to the signed-in user.
- In the same transaction it also deletes the Legacy timeline events that were created from that prayer (for example "Answered: ...").

2. Related records
- prayer_updates and prayer_sessions already reference prayers with ON DELETE CASCADE, so they are removed automatically.
- legacy_events.prayer_id has no foreign key, so it is cleaned up explicitly by this function.

3. Security
- The function runs as the caller (SECURITY INVOKER), so existing row level security on prayers and legacy_events still applies.
- It first checks that the prayer belongs to auth.uid(). If not, it raises an error and nothing is deleted.
- EXECUTE is revoked from PUBLIC and anon and granted only to authenticated.
- No table grants or policies are changed.

4. Notes
- The whole function runs in one transaction. If any step fails, nothing is deleted.
- Other prayers, and legacy events not linked to this prayer, are not touched.
*/

CREATE OR REPLACE FUNCTION public.delete_own_prayer(p_prayer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM prayers WHERE id = p_prayer_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'prayer not found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM legacy_events
  WHERE prayer_id = p_prayer_id AND profile_id = auth.uid();

  DELETE FROM prayers
  WHERE id = p_prayer_id AND user_id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_own_prayer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_prayer(uuid) TO authenticated;
