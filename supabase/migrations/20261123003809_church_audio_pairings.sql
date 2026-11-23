-- Isolated browser audio pairings. Codes and sender proofs are hashed;
-- only the authenticated church-audio-pair function can access these records.
create table private.church_audio_pairings (
  church_id uuid primary key references public.church_profiles(id) on delete cascade,
  config jsonb,
  session jsonb,
  state text not null default 'saved' check (state in ('saved','connecting','live','blocked','offline','error')),
  error_code text,
  revision bigint not null default 0,
  operation_id uuid,
  operation_expires_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table private.church_audio_pairings enable row level security;
revoke all on private.church_audio_pairings from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.church_audio_pairings to service_role;
create index church_audio_pairings_updated_by_idx on private.church_audio_pairings(updated_by);

create function public.church_audio_pairing_service(
  p_church_id uuid,
  p_action text,
  p_operation_id uuid default null,
  p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  current_row private.church_audio_pairings;
begin
  if p_action = 'get' then
    select * into current_row from private.church_audio_pairings where church_id = p_church_id;
    return case when found then to_jsonb(current_row) else null end;
  end if;
  if p_operation_id is null then raise exception 'operation_required'; end if;
  if p_action = 'claim' then
    insert into private.church_audio_pairings(church_id) values (p_church_id) on conflict do nothing;
    select * into current_row from private.church_audio_pairings where church_id = p_church_id for update;
    if current_row.operation_id is not null and current_row.operation_expires_at > now() then
      raise exception 'operation_in_progress';
    end if;
    if (p_payload->>'revision') is null or current_row.revision <> (p_payload->>'revision')::bigint then
      raise exception 'source_changed';
    end if;
    update private.church_audio_pairings
    set operation_id=p_operation_id, operation_expires_at=now()+interval '90 seconds'
    where church_id=p_church_id returning * into current_row;
    return to_jsonb(current_row);
  end if;
  if p_action in ('write','checkpoint') then
    update private.church_audio_pairings set
      config=nullif(p_payload->'config','null'::jsonb),
      session=nullif(p_payload->'session','null'::jsonb),
      state=coalesce(p_payload->>'state','saved'),
      error_code=p_payload->>'error_code',
      updated_by=(p_payload->>'updated_by')::uuid,
      updated_at=now(),
      revision=revision + case when p_action='write' then 1 else 0 end,
      operation_id=case when p_action='write' then null else operation_id end,
      operation_expires_at=case when p_action='write' then null else operation_expires_at end
    where church_id=p_church_id and operation_id=p_operation_id
    returning * into current_row;
    if not found then raise exception 'source_changed'; end if;
    return to_jsonb(current_row);
  end if;
  if p_action = 'release' then
    update private.church_audio_pairings set operation_id=null, operation_expires_at=null
    where church_id=p_church_id and operation_id=p_operation_id;
    return null;
  end if;
  raise exception 'unsupported_action';
end;
$$;
revoke all on function public.church_audio_pairing_service(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.church_audio_pairing_service(uuid,text,uuid,jsonb) to service_role;
