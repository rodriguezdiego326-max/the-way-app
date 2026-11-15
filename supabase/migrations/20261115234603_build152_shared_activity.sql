/*
# Build 152: Shared Activity and unread notifications (in-app only)

1. Summary
- Adds a secure in-app Activity feed for Family and Circle events, with unread state.
- Activity rows are generated only by database triggers, never by the app.
- No push tokens, no APNs, no Edge Functions, no content copied into Activity.

2. New tables
- `activity_notifications`: one row per recipient per event. Holds event type, source kind and id, scope (exactly one of a Family or a Circle), a server-derived actor label and scope label, and `read_at`.
- `activity_preferences`: one optional row per profile with five on/off groups (family, circle, prayer, encouragement, sermon). A missing row means everything is on. Separate from the existing `notification_preferences`.

3. Modified tables
- `family_prayers`, `family_prayer_updates`, `family_sermon_discussions`: new nullable column `created_by_profile_id`, set by trigger to the signed-in user on insert. Existing rows stay null (actor shown as "A member"). No data is removed or altered.

4. Security
- RLS enabled on both new tables. No anon access at all.
- Authenticated users may SELECT only their own Activity rows where they are still a current member of the Family or Circle, and may UPDATE only `read_at` on those rows.
- Authenticated users cannot INSERT or DELETE Activity rows. Inserts happen only in trigger functions.
- Preferences: a user can read, create and update only their own row, and only the on/off columns.
- Private helper and trigger functions are not executable by PUBLIC, anon or authenticated.
- Realtime publication includes `activity_notifications` only (RLS applies to realtime).

5. Important notes
- 5.1 Fan-out uses current membership tables: `family_account_memberships` for Family adults (dependents in `family_members` never receive Activity) and `circle_members` for Circle members.
- 5.2 Each fan-out runs inside a guarded block. If Activity generation fails, the shared action still succeeds and a WARNING is written to the database log.
- 5.3 Removing a member deletes that person's Activity for that Family or Circle. Deleting a source item (prayer, check-in, encouragement, discussion, or membership) deletes its Activity rows.
- 5.4 Deleting a profile clears the actor label on rows that name that person as actor; recipient rows are removed by cascade.
- 5.5 No backfill: only events created after this migration produce Activity.
*/

ALTER TABLE public.family_prayers ADD COLUMN IF NOT EXISTS created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.family_prayer_updates ADD COLUMN IF NOT EXISTS created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.family_sermon_discussions ADD COLUMN IF NOT EXISTS created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS family_prayers_created_by_idx ON public.family_prayers (created_by_profile_id);
CREATE INDEX IF NOT EXISTS family_prayer_updates_created_by_idx ON public.family_prayer_updates (created_by_profile_id);
CREATE INDEX IF NOT EXISTS family_sermon_discussions_created_by_idx ON public.family_sermon_discussions (created_by_profile_id);

CREATE TABLE IF NOT EXISTS public.activity_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_label text,
  family_profile_id uuid REFERENCES public.family_profiles(id) ON DELETE CASCADE,
  circle_id uuid REFERENCES public.circles(id) ON DELETE CASCADE,
  scope_label text,
  event_type text NOT NULL,
  source_kind text NOT NULL,
  source_id uuid NOT NULL,
  source_event_key text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_notifications_scope_check CHECK ((family_profile_id IS NULL) <> (circle_id IS NULL)),
  CONSTRAINT activity_notifications_event_type_check CHECK (event_type IN (
    'family_prayer_added', 'family_prayer_updated', 'family_sermon_discussion_added', 'family_member_joined',
    'circle_prayer_added', 'circle_checkin_added', 'circle_encouragement_received', 'circle_sermon_discussion_added', 'circle_member_joined'
  )),
  CONSTRAINT activity_notifications_event_scope_check CHECK (starts_with(event_type, 'family_') = (family_profile_id IS NOT NULL)),
  CONSTRAINT activity_notifications_source_kind_check CHECK (source_kind IN (
    'family_prayer', 'family_prayer_update', 'family_sermon_discussion', 'family_membership',
    'circle_prayer', 'circle_checkin', 'circle_encouragement', 'circle_sermon_discussion', 'circle_membership'
  )),
  CONSTRAINT activity_notifications_dedupe_key UNIQUE (recipient_profile_id, source_event_key)
);

CREATE INDEX IF NOT EXISTS activity_notifications_feed_idx ON public.activity_notifications (recipient_profile_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS activity_notifications_unread_idx ON public.activity_notifications (recipient_profile_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS activity_notifications_family_idx ON public.activity_notifications (family_profile_id);
CREATE INDEX IF NOT EXISTS activity_notifications_circle_idx ON public.activity_notifications (circle_id);
CREATE INDEX IF NOT EXISTS activity_notifications_actor_idx ON public.activity_notifications (actor_profile_id);
CREATE INDEX IF NOT EXISTS activity_notifications_source_idx ON public.activity_notifications (source_kind, source_id);

CREATE TABLE IF NOT EXISTS public.activity_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_activity boolean NOT NULL DEFAULT true,
  circle_activity boolean NOT NULL DEFAULT true,
  prayer_activity boolean NOT NULL DEFAULT true,
  encouragement_activity boolean NOT NULL DEFAULT true,
  sermon_activity boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_preferences ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.activity_notifications FROM PUBLIC, anon;
REVOKE ALL ON public.activity_preferences FROM PUBLIC, anon;
GRANT SELECT ON public.activity_notifications TO authenticated;
GRANT UPDATE (read_at) ON public.activity_notifications TO authenticated;
GRANT SELECT ON public.activity_preferences TO authenticated;
GRANT INSERT (profile_id, family_activity, circle_activity, prayer_activity, encouragement_activity, sermon_activity, updated_at) ON public.activity_preferences TO authenticated;
GRANT UPDATE (family_activity, circle_activity, prayer_activity, encouragement_activity, sermon_activity, updated_at) ON public.activity_preferences TO authenticated;

DROP POLICY IF EXISTS "select_own_activity" ON public.activity_notifications;
CREATE POLICY "select_own_activity" ON public.activity_notifications FOR SELECT
TO authenticated
USING (
  recipient_profile_id = (SELECT auth.uid())
  AND (
    (family_profile_id IS NOT NULL AND private.is_family_account_member(family_profile_id))
    OR (circle_id IS NOT NULL AND private.is_circle_member(circle_id))
  )
);

DROP POLICY IF EXISTS "update_own_activity_read_state" ON public.activity_notifications;
CREATE POLICY "update_own_activity_read_state" ON public.activity_notifications FOR UPDATE
TO authenticated
USING (
  recipient_profile_id = (SELECT auth.uid())
  AND (
    (family_profile_id IS NOT NULL AND private.is_family_account_member(family_profile_id))
    OR (circle_id IS NOT NULL AND private.is_circle_member(circle_id))
  )
)
WITH CHECK (
  recipient_profile_id = (SELECT auth.uid())
  AND (
    (family_profile_id IS NOT NULL AND private.is_family_account_member(family_profile_id))
    OR (circle_id IS NOT NULL AND private.is_circle_member(circle_id))
  )
);

DROP POLICY IF EXISTS "select_own_activity_preferences" ON public.activity_preferences;
CREATE POLICY "select_own_activity_preferences" ON public.activity_preferences FOR SELECT
TO authenticated
USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "insert_own_activity_preferences" ON public.activity_preferences;
CREATE POLICY "insert_own_activity_preferences" ON public.activity_preferences FOR INSERT
TO authenticated
WITH CHECK (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "update_own_activity_preferences" ON public.activity_preferences;
CREATE POLICY "update_own_activity_preferences" ON public.activity_preferences FOR UPDATE
TO authenticated
USING (profile_id = (SELECT auth.uid()))
WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION private.activity_actor_label(p_profile_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(
    (SELECT NULLIF(BTRIM(pr.display_name), '') FROM public.profiles pr WHERE pr.id = p_profile_id),
    'A member'
  );
$$;

CREATE OR REPLACE FUNCTION private.activity_family_label(p_family_profile_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(
    (SELECT NULLIF(BTRIM(fp.family_name), '') FROM public.family_profiles fp WHERE fp.id = p_family_profile_id),
    'Family'
  );
$$;

CREATE OR REPLACE FUNCTION private.activity_circle_label(p_circle_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(
    (SELECT NULLIF(BTRIM(c.name), '') FROM public.circles c WHERE c.id = p_circle_id),
    'Circle'
  );
$$;

CREATE OR REPLACE FUNCTION private.activity_pref_allows(p_profile_id uuid, p_group text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(
    (SELECT CASE p_group
      WHEN 'family' THEN ap.family_activity
      WHEN 'circle' THEN ap.circle_activity
      WHEN 'prayer' THEN ap.prayer_activity
      WHEN 'encouragement' THEN ap.encouragement_activity
      WHEN 'sermon' THEN ap.sermon_activity
    END
    FROM public.activity_preferences ap WHERE ap.profile_id = p_profile_id),
    true
  );
$$;

CREATE OR REPLACE FUNCTION private.set_family_content_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.created_by_profile_id := (SELECT auth.uid());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_creator_family_prayers ON public.family_prayers;
CREATE TRIGGER set_creator_family_prayers BEFORE INSERT ON public.family_prayers
FOR EACH ROW EXECUTE FUNCTION private.set_family_content_creator();

DROP TRIGGER IF EXISTS set_creator_family_prayer_updates ON public.family_prayer_updates;
CREATE TRIGGER set_creator_family_prayer_updates BEFORE INSERT ON public.family_prayer_updates
FOR EACH ROW EXECUTE FUNCTION private.set_family_content_creator();

DROP TRIGGER IF EXISTS set_creator_family_sermon_discussions ON public.family_sermon_discussions;
CREATE TRIGGER set_creator_family_sermon_discussions BEFORE INSERT ON public.family_sermon_discussions
FOR EACH ROW EXECUTE FUNCTION private.set_family_content_creator();

CREATE OR REPLACE FUNCTION private.activity_family_prayer_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_notifications (recipient_profile_id, actor_profile_id, actor_label, family_profile_id, scope_label, event_type, source_kind, source_id, source_event_key)
    SELECT m.profile_id, NEW.created_by_profile_id, private.activity_actor_label(NEW.created_by_profile_id), NEW.family_profile_id,
      private.activity_family_label(NEW.family_profile_id), 'family_prayer_added', 'family_prayer', NEW.id, 'family_prayer_added:' || NEW.id::text
    FROM public.family_account_memberships m
    WHERE m.family_profile_id = NEW.family_profile_id
      AND m.profile_id IS DISTINCT FROM NEW.created_by_profile_id
      AND private.activity_pref_allows(m.profile_id, 'family')
      AND private.activity_pref_allows(m.profile_id, 'prayer')
    ON CONFLICT (recipient_profile_id, source_event_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'activity fan-out failed for family prayer %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_family_prayer_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_notifications (recipient_profile_id, actor_profile_id, actor_label, family_profile_id, scope_label, event_type, source_kind, source_id, source_event_key)
    SELECT m.profile_id, NEW.created_by_profile_id, private.activity_actor_label(NEW.created_by_profile_id), fp.family_profile_id,
      private.activity_family_label(fp.family_profile_id), 'family_prayer_updated', 'family_prayer_update', NEW.id, 'family_prayer_updated:' || NEW.id::text
    FROM public.family_prayers fp
    JOIN public.family_account_memberships m ON m.family_profile_id = fp.family_profile_id
    WHERE fp.id = NEW.family_prayer_id
      AND m.profile_id IS DISTINCT FROM NEW.created_by_profile_id
      AND private.activity_pref_allows(m.profile_id, 'family')
      AND private.activity_pref_allows(m.profile_id, 'prayer')
    ON CONFLICT (recipient_profile_id, source_event_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'activity fan-out failed for family prayer update %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_family_sermon_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_notifications (recipient_profile_id, actor_profile_id, actor_label, family_profile_id, scope_label, event_type, source_kind, source_id, source_event_key)
    SELECT m.profile_id, NEW.created_by_profile_id, private.activity_actor_label(NEW.created_by_profile_id), NEW.family_profile_id,
      private.activity_family_label(NEW.family_profile_id), 'family_sermon_discussion_added', 'family_sermon_discussion', NEW.id, 'family_sermon_discussion_added:' || NEW.id::text
    FROM public.family_account_memberships m
    WHERE m.family_profile_id = NEW.family_profile_id
      AND m.profile_id IS DISTINCT FROM NEW.created_by_profile_id
      AND private.activity_pref_allows(m.profile_id, 'family')
      AND private.activity_pref_allows(m.profile_id, 'sermon')
    ON CONFLICT (recipient_profile_id, source_event_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'activity fan-out failed for family discussion %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_family_member_joined()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_notifications (recipient_profile_id, actor_profile_id, actor_label, family_profile_id, scope_label, event_type, source_kind, source_id, source_event_key)
    SELECT m.profile_id, NEW.profile_id, private.activity_actor_label(NEW.profile_id), NEW.family_profile_id,
      private.activity_family_label(NEW.family_profile_id), 'family_member_joined', 'family_membership', NEW.id, 'family_member_joined:' || NEW.id::text
    FROM public.family_account_memberships m
    WHERE m.family_profile_id = NEW.family_profile_id
      AND m.profile_id <> NEW.profile_id
      AND private.activity_pref_allows(m.profile_id, 'family')
    ON CONFLICT (recipient_profile_id, source_event_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'activity fan-out failed for family membership %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_circle_prayer_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_notifications (recipient_profile_id, actor_profile_id, actor_label, circle_id, scope_label, event_type, source_kind, source_id, source_event_key)
    SELECT cm.profile_id, NEW.profile_id, private.activity_actor_label(NEW.profile_id), NEW.circle_id,
      private.activity_circle_label(NEW.circle_id), 'circle_prayer_added', 'circle_prayer', NEW.id, 'circle_prayer_added:' || NEW.id::text
    FROM public.circle_members cm
    WHERE cm.circle_id = NEW.circle_id
      AND cm.profile_id IS DISTINCT FROM NEW.profile_id
      AND private.activity_pref_allows(cm.profile_id, 'circle')
      AND private.activity_pref_allows(cm.profile_id, 'prayer')
    ON CONFLICT (recipient_profile_id, source_event_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'activity fan-out failed for circle prayer %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_circle_checkin_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_notifications (recipient_profile_id, actor_profile_id, actor_label, circle_id, scope_label, event_type, source_kind, source_id, source_event_key)
    SELECT cm.profile_id, NEW.profile_id, private.activity_actor_label(NEW.profile_id), NEW.circle_id,
      private.activity_circle_label(NEW.circle_id), 'circle_checkin_added', 'circle_checkin', NEW.id, 'circle_checkin_added:' || NEW.id::text
    FROM public.circle_members cm
    WHERE cm.circle_id = NEW.circle_id
      AND cm.profile_id IS DISTINCT FROM NEW.profile_id
      AND private.activity_pref_allows(cm.profile_id, 'circle')
    ON CONFLICT (recipient_profile_id, source_event_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'activity fan-out failed for circle check-in %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_circle_encouragement_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_notifications (recipient_profile_id, actor_profile_id, actor_label, circle_id, scope_label, event_type, source_kind, source_id, source_event_key)
    SELECT cm.profile_id, NEW.from_profile_id, private.activity_actor_label(NEW.from_profile_id), NEW.circle_id,
      private.activity_circle_label(NEW.circle_id), 'circle_encouragement_received', 'circle_encouragement', NEW.id, 'circle_encouragement_received:' || NEW.id::text
    FROM public.circle_members cm
    WHERE cm.circle_id = NEW.circle_id
      AND cm.profile_id = NEW.to_profile_id
      AND NEW.to_profile_id <> NEW.from_profile_id
      AND private.activity_pref_allows(cm.profile_id, 'circle')
      AND private.activity_pref_allows(cm.profile_id, 'encouragement')
    ON CONFLICT (recipient_profile_id, source_event_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'activity fan-out failed for encouragement %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_circle_sermon_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_notifications (recipient_profile_id, actor_profile_id, actor_label, circle_id, scope_label, event_type, source_kind, source_id, source_event_key)
    SELECT cm.profile_id, NEW.created_by_profile_id, private.activity_actor_label(NEW.created_by_profile_id), NEW.circle_id,
      private.activity_circle_label(NEW.circle_id), 'circle_sermon_discussion_added', 'circle_sermon_discussion', NEW.id, 'circle_sermon_discussion_added:' || NEW.id::text
    FROM public.circle_members cm
    WHERE cm.circle_id = NEW.circle_id
      AND cm.profile_id IS DISTINCT FROM NEW.created_by_profile_id
      AND private.activity_pref_allows(cm.profile_id, 'circle')
      AND private.activity_pref_allows(cm.profile_id, 'sermon')
    ON CONFLICT (recipient_profile_id, source_event_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'activity fan-out failed for circle discussion %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_circle_member_joined()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  BEGIN
    INSERT INTO public.activity_notifications (recipient_profile_id, actor_profile_id, actor_label, circle_id, scope_label, event_type, source_kind, source_id, source_event_key)
    SELECT m.profile_id, NEW.profile_id, private.activity_actor_label(NEW.profile_id), NEW.circle_id,
      private.activity_circle_label(NEW.circle_id), 'circle_member_joined', 'circle_membership', NEW.id, 'circle_member_joined:' || NEW.id::text
    FROM public.circle_members m
    WHERE m.circle_id = NEW.circle_id
      AND m.profile_id <> NEW.profile_id
      AND private.activity_pref_allows(m.profile_id, 'circle')
    ON CONFLICT (recipient_profile_id, source_event_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'activity fan-out failed for circle membership %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS activity_family_prayer_added ON public.family_prayers;
CREATE TRIGGER activity_family_prayer_added AFTER INSERT ON public.family_prayers
FOR EACH ROW EXECUTE FUNCTION private.activity_family_prayer_added();

DROP TRIGGER IF EXISTS activity_family_prayer_updated ON public.family_prayer_updates;
CREATE TRIGGER activity_family_prayer_updated AFTER INSERT ON public.family_prayer_updates
FOR EACH ROW EXECUTE FUNCTION private.activity_family_prayer_updated();

DROP TRIGGER IF EXISTS activity_family_sermon_added ON public.family_sermon_discussions;
CREATE TRIGGER activity_family_sermon_added AFTER INSERT ON public.family_sermon_discussions
FOR EACH ROW EXECUTE FUNCTION private.activity_family_sermon_added();

DROP TRIGGER IF EXISTS activity_family_member_joined ON public.family_account_memberships;
CREATE TRIGGER activity_family_member_joined AFTER INSERT ON public.family_account_memberships
FOR EACH ROW WHEN (NEW.role = 'ADULT') EXECUTE FUNCTION private.activity_family_member_joined();

DROP TRIGGER IF EXISTS activity_circle_prayer_added ON public.shared_prayers;
CREATE TRIGGER activity_circle_prayer_added AFTER INSERT ON public.shared_prayers
FOR EACH ROW WHEN (NEW.visibility = 'circle' AND NEW.circle_id IS NOT NULL) EXECUTE FUNCTION private.activity_circle_prayer_added();

DROP TRIGGER IF EXISTS activity_circle_checkin_added ON public.circle_check_ins;
CREATE TRIGGER activity_circle_checkin_added AFTER INSERT ON public.circle_check_ins
FOR EACH ROW WHEN (NEW.visibility = 'circle' AND NEW.circle_id IS NOT NULL) EXECUTE FUNCTION private.activity_circle_checkin_added();

DROP TRIGGER IF EXISTS activity_circle_encouragement_received ON public.encouragements;
CREATE TRIGGER activity_circle_encouragement_received AFTER INSERT ON public.encouragements
FOR EACH ROW WHEN (NEW.circle_id IS NOT NULL) EXECUTE FUNCTION private.activity_circle_encouragement_received();

DROP TRIGGER IF EXISTS activity_circle_sermon_added ON public.circle_sermon_discussions;
CREATE TRIGGER activity_circle_sermon_added AFTER INSERT ON public.circle_sermon_discussions
FOR EACH ROW EXECUTE FUNCTION private.activity_circle_sermon_added();

DROP TRIGGER IF EXISTS activity_circle_member_joined ON public.circle_members;
CREATE TRIGGER activity_circle_member_joined AFTER INSERT ON public.circle_members
FOR EACH ROW WHEN (NEW.role = 'MEMBER') EXECUTE FUNCTION private.activity_circle_member_joined();

CREATE OR REPLACE FUNCTION private.activity_cleanup_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  DELETE FROM public.activity_notifications
  WHERE source_kind = TG_ARGV[0] AND source_id = OLD.id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_cleanup_family_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  DELETE FROM public.activity_notifications
  WHERE recipient_profile_id = OLD.profile_id AND family_profile_id = OLD.family_profile_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_cleanup_circle_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  DELETE FROM public.activity_notifications
  WHERE recipient_profile_id = OLD.profile_id AND circle_id = OLD.circle_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION private.activity_scrub_deleted_actor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.activity_notifications
  SET actor_profile_id = NULL, actor_label = NULL
  WHERE actor_profile_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS activity_cleanup_family_prayers ON public.family_prayers;
CREATE TRIGGER activity_cleanup_family_prayers AFTER DELETE ON public.family_prayers
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_source('family_prayer');

DROP TRIGGER IF EXISTS activity_cleanup_family_prayer_updates ON public.family_prayer_updates;
CREATE TRIGGER activity_cleanup_family_prayer_updates AFTER DELETE ON public.family_prayer_updates
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_source('family_prayer_update');

DROP TRIGGER IF EXISTS activity_cleanup_family_sermon_discussions ON public.family_sermon_discussions;
CREATE TRIGGER activity_cleanup_family_sermon_discussions AFTER DELETE ON public.family_sermon_discussions
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_source('family_sermon_discussion');

DROP TRIGGER IF EXISTS activity_cleanup_shared_prayers ON public.shared_prayers;
CREATE TRIGGER activity_cleanup_shared_prayers AFTER DELETE ON public.shared_prayers
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_source('circle_prayer');

DROP TRIGGER IF EXISTS activity_cleanup_circle_check_ins ON public.circle_check_ins;
CREATE TRIGGER activity_cleanup_circle_check_ins AFTER DELETE ON public.circle_check_ins
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_source('circle_checkin');

DROP TRIGGER IF EXISTS activity_cleanup_encouragements ON public.encouragements;
CREATE TRIGGER activity_cleanup_encouragements AFTER DELETE ON public.encouragements
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_source('circle_encouragement');

DROP TRIGGER IF EXISTS activity_cleanup_circle_sermon_discussions ON public.circle_sermon_discussions;
CREATE TRIGGER activity_cleanup_circle_sermon_discussions AFTER DELETE ON public.circle_sermon_discussions
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_source('circle_sermon_discussion');

DROP TRIGGER IF EXISTS activity_cleanup_family_membership_source ON public.family_account_memberships;
CREATE TRIGGER activity_cleanup_family_membership_source AFTER DELETE ON public.family_account_memberships
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_source('family_membership');

DROP TRIGGER IF EXISTS activity_cleanup_family_membership_recipient ON public.family_account_memberships;
CREATE TRIGGER activity_cleanup_family_membership_recipient AFTER DELETE ON public.family_account_memberships
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_family_membership();

DROP TRIGGER IF EXISTS activity_cleanup_circle_membership_source ON public.circle_members;
CREATE TRIGGER activity_cleanup_circle_membership_source AFTER DELETE ON public.circle_members
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_source('circle_membership');

DROP TRIGGER IF EXISTS activity_cleanup_circle_membership_recipient ON public.circle_members;
CREATE TRIGGER activity_cleanup_circle_membership_recipient AFTER DELETE ON public.circle_members
FOR EACH ROW EXECUTE FUNCTION private.activity_cleanup_circle_membership();

DROP TRIGGER IF EXISTS activity_scrub_deleted_actor ON public.profiles;
CREATE TRIGGER activity_scrub_deleted_actor BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.activity_scrub_deleted_actor();

REVOKE EXECUTE ON FUNCTION private.activity_actor_label(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_family_label(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_circle_label(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_pref_allows(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.set_family_content_creator() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_family_prayer_added() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_family_prayer_updated() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_family_sermon_added() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_family_member_joined() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_circle_prayer_added() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_circle_checkin_added() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_circle_encouragement_received() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_circle_sermon_added() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_circle_member_joined() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_cleanup_source() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_cleanup_family_membership() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_cleanup_circle_membership() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.activity_scrub_deleted_actor() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_notifications;
  END IF;
END $$;
