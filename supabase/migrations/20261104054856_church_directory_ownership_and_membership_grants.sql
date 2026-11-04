/*
# Church directory ownership, role editing, and secure church import

1. Changes to church_profiles
- user_id may now be empty. An empty owner means a directory church that no one owns.
- New column source: 'user_created' (default, all existing rows), 'apple_maps' (imported from the Apple Maps directory, no owner), 'released' (owner released ownership and left).
- Check: a church with no owner must have source 'apple_maps' or 'released'.

2. Changes to church_memberships
- Check: personal_role must be one of the church role options. Existing rows are not re-checked (NOT VALID).

3. Security changes
- authenticated loses table-wide INSERT and UPDATE on church_profiles and church_memberships.
- Church creation and editing may set only name, city, website. Ownership cannot be set or transferred directly.
- Membership insert may set only profile_id, church_id, personal_role. verified_church_role can no longer be self-assigned on insert.
- Membership update may change only personal_role.
- New function import_church_directory_entry: signed-in users add an Apple Maps church with no owner, or receive the id of an existing church with the same normalized name and city. Never changes an existing church.
- New function release_church_ownership_and_leave: the owner releases ownership (user_id set to empty, source 'released') and removes only their own membership in one transaction.
- Both functions: SECURITY DEFINER with empty search_path, execute revoked from PUBLIC and anon, granted to authenticated.
- Existing row policies are unchanged.

4. Notes
- Account deletion (delete_account_data) removes only churches where user_id matches the deleting account, so ownerless directory churches are preserved.
*/

ALTER TABLE public.church_profiles ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.church_profiles ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user_created';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_profiles_source_check') THEN
    ALTER TABLE public.church_profiles
      ADD CONSTRAINT church_profiles_source_check
      CHECK (source IN ('user_created', 'apple_maps', 'released'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_profiles_ownerless_source_check') THEN
    ALTER TABLE public.church_profiles
      ADD CONSTRAINT church_profiles_ownerless_source_check
      CHECK (user_id IS NOT NULL OR source <> 'user_created');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_memberships_personal_role_check') THEN
    ALTER TABLE public.church_memberships
      ADD CONSTRAINT church_memberships_personal_role_check
      CHECK (personal_role IN ('Member', 'Regular Attender', 'Visitor', 'Pastor', 'Elder', 'Deacon', 'Ministry Leader', 'Other'))
      NOT VALID;
  END IF;
END $$;

REVOKE INSERT, UPDATE ON public.church_profiles FROM authenticated;
GRANT INSERT (name, city, website) ON public.church_profiles TO authenticated;
GRANT UPDATE (name, city, website) ON public.church_profiles TO authenticated;

REVOKE INSERT, UPDATE ON public.church_memberships FROM authenticated;
GRANT INSERT (profile_id, church_id, personal_role) ON public.church_memberships TO authenticated;
GRANT UPDATE (personal_role) ON public.church_memberships TO authenticated;

CREATE OR REPLACE FUNCTION public.import_church_directory_entry(p_name text, p_city text, p_website text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name text := btrim(coalesce(p_name, ''));
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_website text := nullif(btrim(coalesce(p_website, '')), '');
  v_name_key text;
  v_city_key text;
  v_church_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to add a church';
  END IF;

  IF char_length(v_name) NOT BETWEEN 2 AND 120 THEN
    RAISE EXCEPTION 'Church name must be 2 to 120 characters';
  END IF;

  IF v_city IS NOT NULL AND char_length(v_city) > 80 THEN
    RAISE EXCEPTION 'City must be 80 characters or fewer';
  END IF;

  IF v_website IS NOT NULL AND (char_length(v_website) > 300 OR v_website !~* '^https?://') THEN
    v_website := NULL;
  END IF;

  v_name_key := regexp_replace(lower(v_name), '[^[:alnum:]]+', '', 'g');
  v_city_key := regexp_replace(lower(coalesce(v_city, '')), '[^[:alnum:]]+', '', 'g');

  IF v_name_key = '' THEN
    RAISE EXCEPTION 'Church name must contain letters or numbers';
  END IF;

  SELECT cp.id INTO v_church_id
  FROM public.church_profiles cp
  WHERE regexp_replace(lower(cp.name), '[^[:alnum:]]+', '', 'g') = v_name_key
    AND regexp_replace(lower(coalesce(cp.city, '')), '[^[:alnum:]]+', '', 'g') = v_city_key
  ORDER BY cp.created_at ASC NULLS LAST, cp.id
  LIMIT 1;

  IF v_church_id IS NOT NULL THEN
    RETURN v_church_id;
  END IF;

  INSERT INTO public.church_profiles (name, city, website, user_id, source)
  VALUES (v_name, v_city, v_website, NULL, 'apple_maps')
  RETURNING id INTO v_church_id;

  RETURN v_church_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.import_church_directory_entry(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_church_directory_entry(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.release_church_ownership_and_leave(p_church_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_owner uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT cp.user_id INTO v_owner
  FROM public.church_profiles cp
  WHERE cp.id = p_church_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Church not found';
  END IF;

  IF v_owner IS DISTINCT FROM v_actor THEN
    RAISE EXCEPTION 'Only the church owner can release ownership';
  END IF;

  UPDATE public.church_profiles
  SET user_id = NULL, source = 'released'
  WHERE id = p_church_id;

  DELETE FROM public.church_memberships
  WHERE church_id = p_church_id AND profile_id = v_actor;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_church_ownership_and_leave(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_church_ownership_and_leave(uuid) TO authenticated;
