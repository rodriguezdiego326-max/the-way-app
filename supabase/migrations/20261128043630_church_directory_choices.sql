-- Directory aliases retain old records; personal hiding never deletes church data.
ALTER TABLE public.church_profiles ADD COLUMN canonical_church_id uuid REFERENCES public.church_profiles(id);
ALTER TABLE public.church_profiles ADD CONSTRAINT church_canonical_not_self CHECK (canonical_church_id IS DISTINCT FROM id);
CREATE INDEX church_profiles_canonical_idx ON public.church_profiles(canonical_church_id) WHERE canonical_church_id IS NOT NULL;
CREATE TABLE private.church_list_hidden (
 profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 church_id uuid NOT NULL REFERENCES public.church_profiles(id) ON DELETE CASCADE,
 PRIMARY KEY(profile_id,church_id)
);
ALTER TABLE private.church_list_hidden ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.church_list_hidden FROM PUBLIC,anon,authenticated;
CREATE INDEX church_list_hidden_church_idx ON private.church_list_hidden(church_id);
CREATE FUNCTION public.church_choice_details(p_ids uuid[] DEFAULT NULL)
RETURNS TABLE(id uuid,name text,city text,website text,source text,is_mine boolean,hidden boolean)
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT c.id,c.name,c.city,c.website,c.source,c.user_id=auth.uid(),h.church_id IS NOT NULL
 FROM public.church_profiles c
 LEFT JOIN private.church_list_hidden h ON h.church_id=c.id AND h.profile_id=auth.uid()
 WHERE auth.uid() IS NOT NULL AND c.canonical_church_id IS NULL
 AND ((p_ids IS NULL AND h.church_id IS NOT NULL) OR (cardinality(p_ids)<=100 AND c.id=ANY(p_ids)))
 ORDER BY c.name,c.id;
$$;
REVOKE ALL ON FUNCTION public.church_choice_details(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.church_choice_details(uuid[]) TO authenticated;
CREATE FUNCTION public.set_church_hidden(p_church_id uuid,p_hidden boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.church_profiles WHERE id=p_church_id AND canonical_church_id IS NULL) THEN RAISE EXCEPTION 'Church not found'; END IF;
 IF p_hidden IS NULL THEN RAISE EXCEPTION 'Visibility required'; END IF;
 IF p_hidden THEN
 INSERT INTO private.church_list_hidden VALUES(auth.uid(),p_church_id) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM private.church_list_hidden WHERE profile_id=auth.uid() AND church_id=p_church_id;
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_church_hidden(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_church_hidden(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.search_church_directory(p_query text)
RETURNS TABLE(id uuid,name text,city text,website text)
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT c.id,c.name,c.city,c.website FROM public.church_profiles c
 WHERE auth.uid() IS NOT NULL AND c.canonical_church_id IS NULL
 AND NOT EXISTS(SELECT 1 FROM private.church_list_hidden h WHERE h.profile_id=auth.uid() AND h.church_id=c.id)
 AND (coalesce(p_query,'')='' OR c.name ILIKE '%'||p_query||'%' OR c.city ILIKE '%'||p_query||'%')
 ORDER BY c.name,c.id LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.search_church_directory(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.search_church_directory(text) TO authenticated;

create or replace function public.search_complimentary_targets(p_kind text,p_query text)
returns table(id uuid,label text,detail text) language plpgsql security definer set search_path='' as $$
begin
  perform private.require_app_owner();
  if p_query is null or length(trim(p_query))<2 or length(p_query)>100 then return; end if;
  if p_kind='church' then
    return query select c.id,c.name,c.city from public.church_profiles c
    where c.canonical_church_id is null and not exists(select 1 from private.church_list_hidden h where h.profile_id=auth.uid() and h.church_id=c.id) and position(lower(trim(p_query)) in lower(c.name))>0 order by c.name,c.id limit 25;
  elsif p_kind='person' then
    return query select p.id,coalesce(p.display_name,'SOLAPATH member'),u.email::text
    from public.profiles p join auth.users u on u.id=p.id
    where position(lower(trim(p_query)) in lower(coalesce(p.display_name,'')||' '||coalesce(u.email,'')))>0
    order by p.display_name,p.id limit 25;
  else raise exception 'invalid_kind'; end if;
end;
$$;
revoke all on function public.search_complimentary_targets(text,text) from public,anon;
grant execute on function public.search_complimentary_targets(text,text) to authenticated;

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
  WHERE cp.canonical_church_id IS NULL
    AND regexp_replace(lower(coalesce(cp.city, '')), '[^[:alnum:]]+', '', 'g') = v_city_key
    AND (regexp_replace(lower(cp.name), '[^[:alnum:]]+', '', 'g') = v_name_key
      OR (v_website IS NOT NULL AND lower(rtrim(regexp_replace(cp.website, '^https?://(www\.)?', '', 'i'), '/')) = lower(rtrim(regexp_replace(v_website, '^https?://(www\.)?', '', 'i'), '/'))))
  ORDER BY (cp.source='apple_maps') DESC, cp.created_at ASC NULLS LAST, cp.id
  LIMIT 1;

  IF v_church_id IS NOT NULL THEN
    -- Preserve the established ID, memberships and content when a directory match is selected.
    UPDATE public.church_profiles SET source='apple_maps' WHERE id=v_church_id;
    DELETE FROM private.church_list_hidden WHERE profile_id=auth.uid() AND church_id=v_church_id;
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


-- Private rollback evidence for explicitly approved consolidations, never client-writable.
CREATE TABLE private.church_consolidation_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 source_church_id uuid NOT NULL,
 target_church_id uuid NOT NULL,
 before_state jsonb NOT NULL,
 reason text NOT NULL
);
ALTER TABLE private.church_consolidation_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.church_consolidation_audit FROM PUBLIC,anon,authenticated;
