/*
# Build 108: server-only account data deletion

1. Purpose
- Adds one transactional database function that removes every application record owned by a single user, then the profile row. The Auth user is deleted afterwards by the delete-account Edge Function.
- Adds a minimal audit table that stores only an event name, timestamp, and app version. It holds no user ID, profile ID, email, or content.

2. New objects
- `account_deletion_audit` (id, event, occurred_at, app_version). RLS enabled with no policies. No client role is granted access.
- `delete_account_data(p_user_id uuid, p_app_version text)`. SECURITY DEFINER, search_path pinned to public. EXECUTE is granted only to service_role.

3. Behavior
- Deletes only rows where the owner column equals p_user_id. Other users' rows are never touched.
- Shared records (Circles, encouragements, group discussions, acknowledgements) are removed only when the deleting user created them.
- Circles themselves have no owner column, so they are not deleted. Only the deleting user's memberships and content are removed.
- Runs as one statement block. Any failure rolls back every deletion in the call.
- Deleting the profile row cascades to Family, Life, and Growth records that reference it.

4. Security
- Anonymous and signed-in clients cannot execute the function or read the audit table.
- The caller must be the Edge Function, which verifies the user's JWT before passing the user ID.
*/

CREATE TABLE IF NOT EXISTS public.account_deletion_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event text NOT NULL DEFAULT 'account_deletion',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  app_version text NOT NULL DEFAULT 'unknown'
);

ALTER TABLE public.account_deletion_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_deletion_audit FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_account_data(p_user_id uuid, p_app_version text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  DELETE FROM public.ai_usage_log WHERE user_id = p_user_id;
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
  DELETE FROM public.catechism_progress WHERE user_id = p_user_id;

  DELETE FROM public.sermon_notes WHERE profile_id = p_user_id;
  DELETE FROM public.sermons WHERE user_id = p_user_id;
  DELETE FROM public.church_memberships WHERE profile_id = p_user_id;
  DELETE FROM public.church_profiles WHERE user_id = p_user_id;

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

  DELETE FROM public.family_profiles WHERE profile_id = p_user_id;
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
$$;

REVOKE EXECUTE ON FUNCTION public.delete_account_data(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account_data(uuid, text) TO service_role;
