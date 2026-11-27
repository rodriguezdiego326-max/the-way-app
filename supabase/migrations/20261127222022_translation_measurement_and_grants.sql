-- Shadow telemetry only. Nothing in this migration creates invoices or charges.
create table private.translation_connections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  church_id uuid references public.church_profiles(id) on delete cascade,
  mode text not null check (mode in ('church','microphone')),
  room_name text,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default clock_timestamp() + interval '4 hours',
  last_seen timestamptz,
  last_sequence integer not null default -1,
  state text not null default 'waiting' check (state in ('waiting','connected','playing','failed','closed')),
  check ((mode = 'church' and church_id is not null and room_name is not null)
    or (mode = 'microphone' and church_id is null and room_name is null))
);
create table private.translation_observations (
  connection_id uuid not null references private.translation_connections(id) on delete cascade,
  sequence integer not null,
  observed_range tstzrange not null,
  state text not null check (state in ('connected','playing')),
  primary key (connection_id,sequence)
);
create index translation_connections_created_idx on private.translation_connections(created_at);
create index translation_observations_range_idx on private.translation_observations using gist(observed_range);

create table private.complimentary_access (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  church_id uuid references public.church_profiles(id) on delete cascade,
  scope text not null check (scope in ('subscription','translation','full')),
  active boolean not null default true,
  note text not null check (length(note) between 1 and 300),
  granted_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default clock_timestamp(),
  check ((profile_id is null) <> (church_id is null))
);
create unique index complimentary_profile_scope on private.complimentary_access(profile_id,scope) where profile_id is not null;
create unique index complimentary_church_scope on private.complimentary_access(church_id,scope) where church_id is not null;
create table private.complimentary_access_audit (
  id bigint generated always as identity primary key,
  grant_id uuid references private.complimentary_access(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  active boolean not null,
  note text not null,
  created_at timestamptz not null default clock_timestamp()
);

alter table private.translation_connections enable row level security;
alter table private.translation_observations enable row level security;
alter table private.complimentary_access enable row level security;
alter table private.complimentary_access_audit enable row level security;
revoke all on private.translation_connections,private.translation_observations,private.complimentary_access,private.complimentary_access_audit from public,anon,authenticated;

-- Only authenticated token-issuing edge functions may register a connection.
create function public.register_translation_measurement(p_profile_id uuid,p_church_id uuid,p_mode text,p_room_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  insert into private.translation_connections(profile_id,church_id,mode,room_name)
  values(p_profile_id,p_church_id,p_mode,p_room_name) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.register_translation_measurement(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.register_translation_measurement(uuid,uuid,text,text) to service_role;

-- Client observations are explicitly untrusted, never billable. Use server time;
-- cap every interval at 30 seconds so a lost device cannot accumulate hours.
create function public.observe_translation(p_connection_id uuid,p_sequence integer,p_state text)
returns void language plpgsql security definer set search_path='' as $$
declare c private.translation_connections; t timestamptz;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if p_sequence is null or p_sequence < 0 or p_sequence > 1000000
    or p_state is null or p_state not in ('waiting','connected','playing','failed','closed') then
    raise exception 'invalid_observation';
  end if;
  select * into c from private.translation_connections
    where id=p_connection_id and profile_id=auth.uid() for update;
  if not found then raise exception 'connection_not_found'; end if;
  t := clock_timestamp(); -- sample after taking the lock, never before a queued request
  if c.state='closed' or c.expires_at<=t or p_sequence<=c.last_sequence then return; end if;
  if c.last_seen is not null and c.state in ('connected','playing') and t>c.last_seen then
    insert into private.translation_observations values
      (c.id,p_sequence,tstzrange(c.last_seen,least(t,c.last_seen+interval '30 seconds'),'[)'),c.state);
  end if;
  update private.translation_connections set last_seen=t,last_sequence=p_sequence,state=p_state where id=c.id;
end;
$$;
revoke all on function public.observe_translation(uuid,integer,text) from public,anon;
grant execute on function public.observe_translation(uuid,integer,text) to authenticated;

create function private.require_app_owner() returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from private.app_admins where profile_id=auth.uid() and role='APP_OWNER' and active) then
    raise exception 'app_owner_required';
  end if;
end;
$$;
revoke all on function private.require_app_owner() from public,anon,authenticated;

create function public.translation_measurement_summary(p_from timestamptz,p_to timestamptz)
returns table(church_id uuid,church_name text,mode text,people bigint,connected_seconds numeric,playback_seconds numeric)
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_app_owner();
  if p_from is null or p_to is null or p_to<=p_from or p_to-p_from>interval '31 days' then raise exception 'invalid_window'; end if;
  return query
    with per_person as (
      select c.church_id,c.mode,c.profile_id,
        range_agg(o.observed_range * tstzrange(p_from,p_to,'[)')) as connected,
        range_agg(o.observed_range * tstzrange(p_from,p_to,'[)')) filter(where o.state='playing') as playing
      from private.translation_connections c join private.translation_observations o on o.connection_id=c.id
      where o.observed_range && tstzrange(p_from,p_to,'[)')
      group by c.church_id,c.mode,c.profile_id
    )
    select pp.church_id,cp.name,pp.mode,count(*),
      sum((select coalesce(sum(extract(epoch from upper(r)-lower(r))),0) from unnest(pp.connected) r)),
      sum((select coalesce(sum(extract(epoch from upper(r)-lower(r))),0) from unnest(pp.playing) r))
    from per_person pp left join public.church_profiles cp on cp.id=pp.church_id
    group by pp.church_id,cp.name,pp.mode;
end;
$$;
revoke all on function public.translation_measurement_summary(timestamptz,timestamptz) from public,anon;
grant execute on function public.translation_measurement_summary(timestamptz,timestamptz) to authenticated;

create function public.search_complimentary_targets(p_kind text,p_query text)
returns table(id uuid,label text,detail text) language plpgsql security definer set search_path='' as $$
begin
  perform private.require_app_owner();
  if p_query is null or length(trim(p_query))<2 or length(p_query)>100 then return; end if;
  if p_kind='church' then
    return query select c.id,c.name,c.city from public.church_profiles c
    where position(lower(trim(p_query)) in lower(c.name))>0 order by c.name,c.id limit 25;
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

create function public.set_complimentary_access(p_kind text,p_target uuid,p_scope text,p_active boolean,p_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  perform private.require_app_owner();
  if p_kind is null or p_kind not in ('person','church') or p_target is null or p_active is null
    or p_scope is null or p_scope not in ('subscription','translation','full')
    or p_note is null or length(trim(p_note)) not between 1 and 300 then raise exception 'invalid_grant'; end if;
  if p_kind='person' then
    insert into private.complimentary_access(profile_id,scope,active,note,granted_by)
    values(p_target,p_scope,p_active,trim(p_note),auth.uid())
    on conflict(profile_id,scope) where profile_id is not null do update
    set active=excluded.active,note=excluded.note,granted_by=excluded.granted_by,updated_at=clock_timestamp()
    returning id into v_id;
  else
    insert into private.complimentary_access(church_id,scope,active,note,granted_by)
    values(p_target,p_scope,p_active,trim(p_note),auth.uid())
    on conflict(church_id,scope) where church_id is not null do update
    set active=excluded.active,note=excluded.note,granted_by=excluded.granted_by,updated_at=clock_timestamp()
    returning id into v_id;
  end if;
  insert into private.complimentary_access_audit(grant_id,actor_id,active,note)
    values(v_id,auth.uid(),p_active,trim(p_note));
  return v_id;
end;
$$;
revoke all on function public.set_complimentary_access(text,uuid,text,boolean,text) from public,anon;
grant execute on function public.set_complimentary_access(text,uuid,text,boolean,text) to authenticated;

create function public.list_complimentary_access()
returns table(id uuid,target_id uuid,kind text,label text,scope text,active boolean,note text)
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_app_owner();
  return query select g.id,coalesce(g.profile_id,g.church_id),case when g.profile_id is null then 'church' else 'person' end,
    coalesce(c.name,p.display_name,'SOLAPATH member'),g.scope,g.active,g.note
  from private.complimentary_access g left join public.profiles p on p.id=g.profile_id
    left join public.church_profiles c on c.id=g.church_id order by g.updated_at desc limit 500;
end;
$$;
revoke all on function public.list_complimentary_access() from public,anon;
grant execute on function public.list_complimentary_access() to authenticated;

-- Future billing code must resolve grants on the server. A church grant applies
-- to the church's subscription/translation, not to members' personal purchases.
create function public.resolve_complimentary_access(p_profile_id uuid,p_church_id uuid,p_scope text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.complimentary_access g where p_scope in ('subscription','translation','full') and g.active and (g.scope=p_scope or g.scope='full')
    and ((p_church_id is null and g.profile_id=p_profile_id) or (p_church_id is not null and g.church_id=p_church_id)));
$$;
revoke all on function public.resolve_complimentary_access(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.resolve_complimentary_access(uuid,uuid,text) to service_role;

-- Operational cleanup can run daily; grant audit records are retained.
create function public.purge_translation_measurements() returns void language sql security definer set search_path='' as $$
  delete from private.translation_connections where created_at<clock_timestamp()-interval '90 days';
$$;
revoke all on function public.purge_translation_measurements() from public,anon,authenticated;
grant execute on function public.purge_translation_measurements() to service_role;
