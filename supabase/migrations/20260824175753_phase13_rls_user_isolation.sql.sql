/*
# Phase 13: Row Level Security & User Data Isolation

Replaces ALL USING(true) policies with proper auth.uid()-based ownership.
Also adds user_id columns to 19 private tables, links profiles to auth.users,
locks down SECURITY DEFINER functions, and revokes anon access.
*/

-- STEP 1: Link profiles to auth.users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_id_auth_users_fkey' AND table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_id_auth_users_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- STEP 2: Add user_id columns
DO $$ DECLARE auth_uid uuid;
BEGIN
  SELECT id INTO auth_uid FROM auth.users LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayers' AND column_name='user_id') THEN
    ALTER TABLE prayers ADD COLUMN user_id uuid; UPDATE prayers SET user_id = auth_uid; ALTER TABLE prayers ALTER COLUMN user_id SET NOT NULL; ALTER TABLE prayers ADD CONSTRAINT prayers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_updates' AND column_name='user_id') THEN
    ALTER TABLE prayer_updates ADD COLUMN user_id uuid; UPDATE prayer_updates pu SET user_id = p.user_id FROM prayers p WHERE pu.prayer_id = p.id; UPDATE prayer_updates SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE prayer_updates ALTER COLUMN user_id SET NOT NULL; ALTER TABLE prayer_updates ADD CONSTRAINT prayer_updates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='walks' AND column_name='user_id') THEN
    ALTER TABLE walks ADD COLUMN user_id uuid; UPDATE walks SET user_id = auth_uid; ALTER TABLE walks ALTER COLUMN user_id SET NOT NULL; ALTER TABLE walks ADD CONSTRAINT walks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='walk_reflections' AND column_name='user_id') THEN
    ALTER TABLE walk_reflections ADD COLUMN user_id uuid; UPDATE walk_reflections wr SET user_id = w.user_id FROM walks w WHERE wr.walk_id = w.id; UPDATE walk_reflections SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE walk_reflections ALTER COLUMN user_id SET NOT NULL; ALTER TABLE walk_reflections ADD CONSTRAINT walk_reflections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_checkins' AND column_name='user_id') THEN
    ALTER TABLE daily_checkins ADD COLUMN user_id uuid; UPDATE daily_checkins SET user_id = auth_uid; ALTER TABLE daily_checkins ALTER COLUMN user_id SET NOT NULL; ALTER TABLE daily_checkins ADD CONSTRAINT daily_checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='memories' AND column_name='user_id') THEN
    ALTER TABLE memories ADD COLUMN user_id uuid; UPDATE memories SET user_id = auth_uid; ALTER TABLE memories ALTER COLUMN user_id SET NOT NULL; ALTER TABLE memories ADD CONSTRAINT memories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ask_conversations' AND column_name='user_id') THEN
    ALTER TABLE ask_conversations ADD COLUMN user_id uuid; UPDATE ask_conversations SET user_id = auth_uid; ALTER TABLE ask_conversations ALTER COLUMN user_id SET NOT NULL; ALTER TABLE ask_conversations ADD CONSTRAINT ask_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ask_messages' AND column_name='user_id') THEN
    ALTER TABLE ask_messages ADD COLUMN user_id uuid; UPDATE ask_messages am SET user_id = ac.user_id FROM ask_conversations ac WHERE am.conversation_id = ac.id; UPDATE ask_messages SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE ask_messages ALTER COLUMN user_id SET NOT NULL; ALTER TABLE ask_messages ADD CONSTRAINT ask_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='catechism_progress' AND column_name='user_id') THEN
    ALTER TABLE catechism_progress ADD COLUMN user_id uuid; UPDATE catechism_progress cp SET user_id = fp.profile_id FROM family_profiles fp WHERE cp.family_profile_id = fp.id; UPDATE catechism_progress SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE catechism_progress ALTER COLUMN user_id SET NOT NULL; ALTER TABLE catechism_progress ADD CONSTRAINT catechism_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversation_practice' AND column_name='user_id') THEN
    ALTER TABLE conversation_practice ADD COLUMN user_id uuid; UPDATE conversation_practice SET user_id = auth_uid; ALTER TABLE conversation_practice ALTER COLUMN user_id SET NOT NULL; ALTER TABLE conversation_practice ADD CONSTRAINT conversation_practice_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reach_people' AND column_name='user_id') THEN
    ALTER TABLE reach_people ADD COLUMN user_id uuid; UPDATE reach_people SET user_id = auth_uid; ALTER TABLE reach_people ALTER COLUMN user_id SET NOT NULL; ALTER TABLE reach_people ADD CONSTRAINT reach_people_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reach_conversations' AND column_name='user_id') THEN
    ALTER TABLE reach_conversations ADD COLUMN user_id uuid; UPDATE reach_conversations rc SET user_id = rp.user_id FROM reach_people rp WHERE rc.reach_person_id = rp.id; UPDATE reach_conversations SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE reach_conversations ALTER COLUMN user_id SET NOT NULL; ALTER TABLE reach_conversations ADD CONSTRAINT reach_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reach_prayer_updates' AND column_name='user_id') THEN
    ALTER TABLE reach_prayer_updates ADD COLUMN user_id uuid; UPDATE reach_prayer_updates rpu SET user_id = rp.user_id FROM reach_people rp WHERE rpu.reach_person_id = rp.id; UPDATE reach_prayer_updates SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE reach_prayer_updates ALTER COLUMN user_id SET NOT NULL; ALTER TABLE reach_prayer_updates ADD CONSTRAINT reach_prayer_updates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prodigal_journey' AND column_name='user_id') THEN
    ALTER TABLE prodigal_journey ADD COLUMN user_id uuid; UPDATE prodigal_journey SET user_id = auth_uid; ALTER TABLE prodigal_journey ALTER COLUMN user_id SET NOT NULL; ALTER TABLE prodigal_journey ADD CONSTRAINT prodigal_journey_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prodigal_updates' AND column_name='user_id') THEN
    ALTER TABLE prodigal_updates ADD COLUMN user_id uuid; UPDATE prodigal_updates pu SET user_id = pj.user_id FROM prodigal_journey pj WHERE pu.prodigal_id = pj.id; UPDATE prodigal_updates SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE prodigal_updates ALTER COLUMN user_id SET NOT NULL; ALTER TABLE prodigal_updates ADD CONSTRAINT prodigal_updates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='user_id') THEN
    ALTER TABLE church_profiles ADD COLUMN user_id uuid; UPDATE church_profiles SET user_id = auth_uid; ALTER TABLE church_profiles ALTER COLUMN user_id SET NOT NULL; ALTER TABLE church_profiles ADD CONSTRAINT church_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sermons' AND column_name='user_id') THEN
    ALTER TABLE sermons ADD COLUMN user_id uuid; UPDATE sermons s SET user_id = cp.user_id FROM church_profiles cp WHERE s.church_id = cp.id; UPDATE sermons SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE sermons ALTER COLUMN user_id SET NOT NULL; ALTER TABLE sermons ADD CONSTRAINT sermons_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shared_scripture_studies' AND column_name='user_id') THEN
    ALTER TABLE shared_scripture_studies ADD COLUMN user_id uuid; UPDATE shared_scripture_studies SET user_id = assigned_by_profile_id; UPDATE shared_scripture_studies SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE shared_scripture_studies ALTER COLUMN user_id SET NOT NULL; ALTER TABLE shared_scripture_studies ADD CONSTRAINT shared_scripture_studies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='group_discussions' AND column_name='user_id') THEN
    ALTER TABLE group_discussions ADD COLUMN user_id uuid; UPDATE group_discussions SET user_id = profile_id; UPDATE group_discussions SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE group_discussions ALTER COLUMN user_id SET NOT NULL; ALTER TABLE group_discussions ADD CONSTRAINT group_discussions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='encouragements' AND column_name='user_id') THEN
    ALTER TABLE encouragements ADD COLUMN user_id uuid; UPDATE encouragements SET user_id = from_profile_id; UPDATE encouragements SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE encouragements ALTER COLUMN user_id SET NOT NULL; ALTER TABLE encouragements ADD CONSTRAINT encouragements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_acknowledgements' AND column_name='user_id') THEN
    ALTER TABLE prayer_acknowledgements ADD COLUMN user_id uuid; UPDATE prayer_acknowledgements SET user_id = profile_id; UPDATE prayer_acknowledgements SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE prayer_acknowledgements ALTER COLUMN user_id SET NOT NULL; ALTER TABLE prayer_acknowledgements ADD CONSTRAINT prayer_acknowledgements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='circle_check_ins' AND column_name='user_id') THEN
    ALTER TABLE circle_check_ins ADD COLUMN user_id uuid; UPDATE circle_check_ins SET user_id = profile_id; UPDATE circle_check_ins SET user_id = auth_uid WHERE user_id IS NULL; ALTER TABLE circle_check_ins ALTER COLUMN user_id SET NOT NULL; ALTER TABLE circle_check_ins ADD CONSTRAINT circle_check_ins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF;
END $$;

-- STEP 3: Drop all existing policies
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- STEP 4: Create new policies

-- 4a. PROFILES
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- 4b. USER-PRIVATE TABLES WITH user_id
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['prayers','prayer_updates','walks','walk_reflections','daily_checkins','memories','ask_conversations','ask_messages','catechism_progress','conversation_practice','reach_people','reach_conversations','reach_prayer_updates','prodigal_journey','prodigal_updates','circle_check_ins','encouragements','prayer_acknowledgements','group_discussions']) LOOP
    EXECUTE format('CREATE POLICY "select_own_%s" ON %I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "insert_own_%s" ON %I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "update_own_%s" ON %I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "delete_own_%s" ON %I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;

-- 4c. USER-PRIVATE TABLES WITH profile_id
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['accountability_relationships','beta_feedback','current_studies','growth_areas','life_areas','life_stages','notification_preferences','sermon_notes','church_memberships']) LOOP
    EXECUTE format('CREATE POLICY "select_own_%s" ON %I FOR SELECT TO authenticated USING (auth.uid() = profile_id)', t, t);
    EXECUTE format('CREATE POLICY "insert_own_%s" ON %I FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id)', t, t);
    EXECUTE format('CREATE POLICY "update_own_%s" ON %I FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id)', t, t);
    EXECUTE format('CREATE POLICY "delete_own_%s" ON %I FOR DELETE TO authenticated USING (auth.uid() = profile_id)', t, t);
  END LOOP;
END $$;

-- 4d. LEGACY TABLES
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['legacy_designated_persons','legacy_events','legacy_letters','legacy_life_seasons','legacy_milestones','legacy_scripture_refs','legacy_testimony','legacy_year_reviews']) LOOP
    EXECUTE format('CREATE POLICY "select_own_%s" ON %I FOR SELECT TO authenticated USING (auth.uid() = profile_id)', t, t);
    EXECUTE format('CREATE POLICY "insert_own_%s" ON %I FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id)', t, t);
    EXECUTE format('CREATE POLICY "update_own_%s" ON %I FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id)', t, t);
    EXECUTE format('CREATE POLICY "delete_own_%s" ON %I FOR DELETE TO authenticated USING (auth.uid() = profile_id)', t, t);
  END LOOP;
END $$;

-- 4e. FAMILY TABLES
CREATE POLICY "select_own_family_profiles" ON family_profiles FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "insert_own_family_profiles" ON family_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "update_own_family_profiles" ON family_profiles FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "delete_own_family_profiles" ON family_profiles FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- family_members, family_prayers, family_walks, family_journey_progress: direct family_profile_id
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['family_members','family_prayers','family_walks','family_journey_progress']) LOOP
    EXECUTE format('CREATE POLICY "select_own_%s" ON %I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM family_profiles fp WHERE fp.id = %I.family_profile_id AND fp.profile_id = auth.uid()))', t, t, t);
    EXECUTE format('CREATE POLICY "insert_own_%s" ON %I FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM family_profiles fp WHERE fp.id = %I.family_profile_id AND fp.profile_id = auth.uid()))', t, t, t);
    EXECUTE format('CREATE POLICY "update_own_%s" ON %I FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM family_profiles fp WHERE fp.id = %I.family_profile_id AND fp.profile_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM family_profiles fp WHERE fp.id = %I.family_profile_id AND fp.profile_id = auth.uid()))', t, t, t, t);
    EXECUTE format('CREATE POLICY "delete_own_%s" ON %I FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM family_profiles fp WHERE fp.id = %I.family_profile_id AND fp.profile_id = auth.uid()))', t, t, t);
  END LOOP;
END $$;

-- family_prayer_updates: links via family_prayer_id -> family_prayers -> family_profiles
CREATE POLICY "select_own_family_prayer_updates" ON family_prayer_updates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM family_prayers fp JOIN family_profiles fpp ON fpp.id = fp.family_profile_id WHERE fp.id = family_prayer_updates.family_prayer_id AND fpp.profile_id = auth.uid()));
CREATE POLICY "insert_own_family_prayer_updates" ON family_prayer_updates FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM family_prayers fp JOIN family_profiles fpp ON fpp.id = fp.family_profile_id WHERE fp.id = family_prayer_updates.family_prayer_id AND fpp.profile_id = auth.uid()));
CREATE POLICY "update_own_family_prayer_updates" ON family_prayer_updates FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM family_prayers fp JOIN family_profiles fpp ON fpp.id = fp.family_profile_id WHERE fp.id = family_prayer_updates.family_prayer_id AND fpp.profile_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM family_prayers fp JOIN family_profiles fpp ON fpp.id = fp.family_profile_id WHERE fp.id = family_prayer_updates.family_prayer_id AND fpp.profile_id = auth.uid()));
CREATE POLICY "delete_own_family_prayer_updates" ON family_prayer_updates FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM family_prayers fp JOIN family_profiles fpp ON fpp.id = fp.family_profile_id WHERE fp.id = family_prayer_updates.family_prayer_id AND fpp.profile_id = auth.uid()));

-- 4f. SHARED TABLES (circles)
CREATE POLICY "select_own_circles" ON circles FOR SELECT TO authenticated USING (auth.uid() = owner_profile_id OR is_circle_member(id, auth.uid()));
CREATE POLICY "insert_own_circles" ON circles FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_profile_id);
CREATE POLICY "update_own_circles" ON circles FOR UPDATE TO authenticated USING (auth.uid() = owner_profile_id) WITH CHECK (auth.uid() = owner_profile_id);
CREATE POLICY "delete_own_circles" ON circles FOR DELETE TO authenticated USING (auth.uid() = owner_profile_id);

CREATE POLICY "select_circle_members" ON circle_members FOR SELECT TO authenticated USING (auth.uid() = profile_id OR is_circle_member(circle_id, auth.uid()));
CREATE POLICY "insert_circle_members" ON circle_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "update_circle_members" ON circle_members FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "delete_circle_members" ON circle_members FOR DELETE TO authenticated USING (auth.uid() = profile_id OR is_circle_leader(circle_id, auth.uid()));

CREATE POLICY "select_circle_invitations" ON circle_invitations FOR SELECT TO authenticated USING (auth.uid() = invited_by_profile_id OR auth.uid() = accepted_by_profile_id OR is_circle_leader(circle_id, auth.uid()));
CREATE POLICY "insert_circle_invitations" ON circle_invitations FOR INSERT TO authenticated WITH CHECK (auth.uid() = invited_by_profile_id);
CREATE POLICY "update_circle_invitations" ON circle_invitations FOR UPDATE TO authenticated USING (auth.uid() = invited_by_profile_id OR auth.uid() = accepted_by_profile_id) WITH CHECK (auth.uid() = invited_by_profile_id OR auth.uid() = accepted_by_profile_id);
CREATE POLICY "delete_circle_invitations" ON circle_invitations FOR DELETE TO authenticated USING (auth.uid() = invited_by_profile_id OR is_circle_leader(circle_id, auth.uid()));

CREATE POLICY "select_shared_prayers" ON shared_prayers FOR SELECT TO authenticated USING (auth.uid() = profile_id OR is_circle_member(circle_id, auth.uid()));
CREATE POLICY "insert_shared_prayers" ON shared_prayers FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "update_shared_prayers" ON shared_prayers FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "delete_shared_prayers" ON shared_prayers FOR DELETE TO authenticated USING (auth.uid() = profile_id);

CREATE POLICY "select_shared_reflections" ON shared_reflections FOR SELECT TO authenticated USING (auth.uid() = profile_id OR is_circle_member(circle_id, auth.uid()));
CREATE POLICY "insert_shared_reflections" ON shared_reflections FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "update_shared_reflections" ON shared_reflections FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "delete_shared_reflections" ON shared_reflections FOR DELETE TO authenticated USING (auth.uid() = profile_id);

CREATE POLICY "select_shared_scripture_studies" ON shared_scripture_studies FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_circle_member(circle_id, auth.uid()));
CREATE POLICY "insert_shared_scripture_studies" ON shared_scripture_studies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_shared_scripture_studies" ON shared_scripture_studies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_shared_scripture_studies" ON shared_scripture_studies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4g. CHURCH TABLES
CREATE POLICY "select_church_profiles" ON church_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM church_memberships cm WHERE cm.church_id = church_profiles.id AND cm.profile_id = auth.uid()));
CREATE POLICY "insert_church_profiles" ON church_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_church_profiles" ON church_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_church_profiles" ON church_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_church_memberships" ON church_memberships FOR SELECT TO authenticated USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_memberships.church_id AND cp.user_id = auth.uid()));
CREATE POLICY "insert_church_memberships" ON church_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "update_church_memberships" ON church_memberships FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "delete_church_memberships" ON church_memberships FOR DELETE TO authenticated USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_memberships.church_id AND cp.user_id = auth.uid()));

CREATE POLICY "select_church_groups" ON church_groups FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM church_memberships cm WHERE cm.church_id = church_groups.church_id AND cm.profile_id = auth.uid()));
CREATE POLICY "insert_church_groups" ON church_groups FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_groups.church_id AND cp.user_id = auth.uid()));
CREATE POLICY "update_church_groups" ON church_groups FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_groups.church_id AND cp.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_groups.church_id AND cp.user_id = auth.uid()));
CREATE POLICY "delete_church_groups" ON church_groups FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_groups.church_id AND cp.user_id = auth.uid()));

CREATE POLICY "select_church_prayer_items" ON church_prayer_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM church_memberships cm WHERE cm.church_id = church_prayer_items.church_id AND cm.profile_id = auth.uid()));
CREATE POLICY "insert_church_prayer_items" ON church_prayer_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM church_memberships cm WHERE cm.church_id = church_prayer_items.church_id AND cm.profile_id = auth.uid()));
CREATE POLICY "update_church_prayer_items" ON church_prayer_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM church_memberships cm WHERE cm.church_id = church_prayer_items.church_id AND cm.profile_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM church_memberships cm WHERE cm.church_id = church_prayer_items.church_id AND cm.profile_id = auth.uid()));
CREATE POLICY "delete_church_prayer_items" ON church_prayer_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM church_memberships cm WHERE cm.church_id = church_prayer_items.church_id AND cm.profile_id = auth.uid()));

CREATE POLICY "select_church_studies" ON church_studies FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM church_memberships cm WHERE cm.church_id = church_studies.church_id AND cm.profile_id = auth.uid()));
CREATE POLICY "insert_church_studies" ON church_studies FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_studies.church_id AND cp.user_id = auth.uid()));
CREATE POLICY "update_church_studies" ON church_studies FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_studies.church_id AND cp.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_studies.church_id AND cp.user_id = auth.uid()));
CREATE POLICY "delete_church_studies" ON church_studies FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM church_profiles cp WHERE cp.id = church_studies.church_id AND cp.user_id = auth.uid()));

CREATE POLICY "select_church_study_assignments" ON church_study_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM church_studies cs JOIN church_memberships cm ON cm.church_id = cs.church_id WHERE cs.id = church_study_assignments.church_study_id AND cm.profile_id = auth.uid()));
CREATE POLICY "insert_church_study_assignments" ON church_study_assignments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM church_studies cs JOIN church_profiles cp ON cp.id = cs.church_id WHERE cs.id = church_study_assignments.church_study_id AND cp.user_id = auth.uid()));
CREATE POLICY "update_church_study_assignments" ON church_study_assignments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM church_studies cs JOIN church_profiles cp ON cp.id = cs.church_id WHERE cs.id = church_study_assignments.church_study_id AND cp.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM church_studies cs JOIN church_profiles cp ON cp.id = cs.church_id WHERE cs.id = church_study_assignments.church_study_id AND cp.user_id = auth.uid()));
CREATE POLICY "delete_church_study_assignments" ON church_study_assignments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM church_studies cs JOIN church_profiles cp ON cp.id = cs.church_id WHERE cs.id = church_study_assignments.church_study_id AND cp.user_id = auth.uid()));

CREATE POLICY "select_sermons" ON sermons FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM church_memberships cm WHERE cm.church_id = sermons.church_id AND cm.profile_id = auth.uid()));
CREATE POLICY "insert_sermons" ON sermons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_sermons" ON sermons FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_sermons" ON sermons FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4h. PUBLIC REFERENCE DATA
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['bible_translations','confessional_documents','doctrine_taxonomy','doctrines','library_authors','library_confessions','library_creeds','library_sources','scripture_references','source_batches','source_chunks','source_doctrines','sources','theological_authors']) LOOP
    EXECUTE format('CREATE POLICY "select_ref_%s" ON %I FOR SELECT TO authenticated USING (true)', t, t);
  END LOOP;
END $$;

-- 4i. AI USAGE LOG
CREATE POLICY "select_own_ai_usage_log" ON ai_usage_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_ai_usage_log" ON ai_usage_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4j. THEOLOGICAL CONCERN REPORTS
CREATE POLICY "select_own_theological_concern_reports" ON theological_concern_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_theological_concern_reports" ON theological_concern_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4k. ADMIN-ONLY TABLES
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['audit_trail','regression_tests','release_gate','retrieval_log','system_versions','theological_reviews']) LOOP
    EXECUTE format('CREATE POLICY "select_admin_%s" ON %I FOR SELECT TO authenticated USING (is_admin())', t, t);
  END LOOP;
END $$;

-- 4l. APP_SETTINGS
CREATE POLICY "select_app_settings" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_app_settings" ON app_settings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 4m. FEATURE_FLAGS
CREATE POLICY "select_feature_flags" ON feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_feature_flags" ON feature_flags FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- STEP 5: Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION can_perform_church_admin_action(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_circle_leader(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_circle_member(uuid, uuid) FROM anon, authenticated;
ALTER FUNCTION can_perform_church_admin_action(uuid, uuid) SET search_path = public;
ALTER FUNCTION is_admin() SET search_path = public;
ALTER FUNCTION is_circle_leader(uuid, uuid) SET search_path = public;
ALTER FUNCTION is_circle_member(uuid, uuid) SET search_path = public;

-- STEP 6: Revoke anon, grant authenticated
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;
END $$;
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT IN ('rate_limit_buckets','retrieval_cache') LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', t);
  END LOOP;
END $$;

-- STEP 7: Indexes
CREATE INDEX IF NOT EXISTS idx_prayers_user_id ON prayers(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_updates_user_id ON prayer_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_walks_user_id ON walks(user_id);
CREATE INDEX IF NOT EXISTS idx_walk_reflections_user_id ON walk_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ask_conversations_user_id ON ask_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ask_messages_user_id ON ask_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_catechism_progress_user_id ON catechism_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_practice_user_id ON conversation_practice(user_id);
CREATE INDEX IF NOT EXISTS idx_reach_people_user_id ON reach_people(user_id);
CREATE INDEX IF NOT EXISTS idx_reach_conversations_user_id ON reach_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_reach_prayer_updates_user_id ON reach_prayer_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_prodigal_journey_user_id ON prodigal_journey(user_id);
CREATE INDEX IF NOT EXISTS idx_prodigal_updates_user_id ON prodigal_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_church_profiles_user_id ON church_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sermons_user_id ON sermons(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_scripture_studies_user_id ON shared_scripture_studies(user_id);
CREATE INDEX IF NOT EXISTS idx_group_discussions_user_id ON group_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_user_id ON encouragements(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_acknowledgements_user_id ON prayer_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_check_ins_user_id ON circle_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_id ON ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_theological_concern_reports_user_id ON theological_concern_reports(user_id);
