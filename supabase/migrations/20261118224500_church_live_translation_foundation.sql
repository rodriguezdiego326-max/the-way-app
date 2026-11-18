-- SOLAPATH 0.3.0 — Church Live Translation foundation
-- Safe member-visible settings + private provider configuration.

create table if not exists public.church_live_translation_settings (
  church_id uuid primary key references public.church_profiles(id) on delete cascade,
  enabled boolean not null default false,
  input_type text not null default 'rtmp'
    check (input_type in ('rtmp','whip')),
  source_language text not null default 'en'
    check (source_language in ('en','es')),
  target_language text not null default 'es'
    check (target_language in ('en','es')),
  provider_status text not null default 'not_connected'
    check (provider_status in ('not_connected','provisioning','ready','live','offline','error')),
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  updated_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_language <> target_language)
);

alter table public.church_live_translation_settings enable row level security;

grant select, insert, update on public.church_live_translation_settings to authenticated;
revoke delete on public.church_live_translation_settings from authenticated, anon;

create index if not exists idx_church_live_translation_status
  on public.church_live_translation_settings(provider_status);

drop policy if exists select_church_live_translation_settings on public.church_live_translation_settings;
create policy select_church_live_translation_settings
on public.church_live_translation_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.church_memberships cm
    where cm.church_id = church_live_translation_settings.church_id
      and cm.profile_id = (select auth.uid())
  )
);

drop policy if exists insert_church_live_translation_settings on public.church_live_translation_settings;
create policy insert_church_live_translation_settings
on public.church_live_translation_settings
for insert
to authenticated
with check (
  private.is_verified_church_leadership(church_id)
  and created_by_profile_id = (select auth.uid())
  and updated_by_profile_id = (select auth.uid())
);

drop policy if exists update_church_live_translation_settings on public.church_live_translation_settings;
create policy update_church_live_translation_settings
on public.church_live_translation_settings
for update
to authenticated
using (private.is_verified_church_leadership(church_id))
with check (
  private.is_verified_church_leadership(church_id)
  and updated_by_profile_id = (select auth.uid())
);

create table if not exists private.church_live_provider_config (
  church_id uuid primary key references public.church_profiles(id) on delete cascade,
  provider text not null default 'livekit' check (provider = 'livekit'),
  room_name text not null,
  ingress_id text not null,
  ingress_url text not null,
  stream_key text,
  input_type text not null check (input_type in ('rtmp','whip')),
  updated_at timestamptz not null default now()
);

revoke all on table private.church_live_provider_config
from public, anon, authenticated;

grant usage on schema private to service_role;
grant select, insert, update on table private.church_live_provider_config to service_role;

create or replace function public.save_church_live_provider_config_for_service(
  p_church_id uuid,
  p_room_name text,
  p_ingress_id text,
  p_ingress_url text,
  p_stream_key text,
  p_input_type text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $
begin
  if p_input_type not in ('rtmp','whip') then
    raise exception 'invalid_input_type';
  end if;

  insert into private.church_live_provider_config (
    church_id, provider, room_name, ingress_id, ingress_url, stream_key, input_type, updated_at
  )
  values (
    p_church_id, 'livekit', p_room_name, p_ingress_id, p_ingress_url, p_stream_key, p_input_type, now()
  )
  on conflict (church_id) do update
  set room_name = excluded.room_name,
      ingress_id = excluded.ingress_id,
      ingress_url = excluded.ingress_url,
      stream_key = excluded.stream_key,
      input_type = excluded.input_type,
      updated_at = now();
end;
$$;

revoke execute on function public.save_church_live_provider_config_for_service(uuid,text,text,text,text,text)
from public, anon, authenticated;
grant execute on function public.save_church_live_provider_config_for_service(uuid,text,text,text,text,text)
to service_role;

create or replace function public.get_church_live_provider_config_for_service(
  p_church_id uuid
)
returns table (
  room_name text,
  ingress_id text,
  ingress_url text,
  stream_key text,
  input_type text
)
language sql
stable
security invoker
set search_path = ''
as $
  select c.room_name, c.ingress_id, c.ingress_url, c.stream_key, c.input_type
  from private.church_live_provider_config c
  where c.church_id = p_church_id;
$;

revoke execute on function public.get_church_live_provider_config_for_service(uuid)
from public, anon, authenticated;
grant execute on function public.get_church_live_provider_config_for_service(uuid)
to service_role;
