/*
# Account deletion keeps church libraries (Build 113)

1. Plain-English summary
- Deleting an account now removes that person's church admin claims.
- Churches the person owned are no longer deleted. Their owner is cleared, so the church stays in the directory as an ownerless entry, along with its published and draft studies.
- Church studies stay in place. Studies they published keep their content, and the publisher reference is cleared.

2. Changed function: delete_account_data(p_user_id, p_app_version)
- Adds deletion of church_admin_claims for the deleting user.
- Replaces deletion of church_profiles owned by the user with clearing of its user_id. Deleting the church row would cascade to church_studies and church_study_assignments.
- All other deletions are unchanged.

3. Security
- The function keeps its existing SECURITY DEFINER definition, search_path, and EXECUTE grants.
*/

CREATE OR REPLACE FUNCTION public.delete_account_data(p_user_id uuid, p_app_version text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
DELETE FROM public.church_admin_claims WHERE profile_id = p_user_id;
DELETE FROM public.church_memberships WHERE profile_id = p_user_id;
UPDATE public.church_profiles SET user_id = NULL WHERE user_id = p_user_id;

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
$function$;
