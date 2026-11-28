-- Eligibility registry only: no payment collection or provider subscription edits.
-- Slots are lifetime allocations and never recycled, including after church deletion.
create table private.founding_church_slots (
  slot smallint primary key check (slot between 1 and 10),
  church_id uuid unique references public.church_profiles(id) on delete set null,
  church_name text,
  assigned_at timestamptz,
  assigned_by uuid references public.profiles(id) on delete set null,
  note text,
  subscription_discount_percent smallint not null default 50 check (subscription_discount_percent = 50),
  check ((assigned_at is null and church_id is null and church_name is null and assigned_by is null and note is null)
    or (assigned_at is not null and church_name is not null and note is not null and length(trim(note)) between 1 and 300))
);
create index founding_church_assigned_by_idx on private.founding_church_slots(assigned_by) where assigned_by is not null;
alter table private.founding_church_slots enable row level security;
revoke all on private.founding_church_slots from public,anon,authenticated,service_role;
insert into private.founding_church_slots(slot) select generate_series(1,10);

create function public.list_founding_church_discounts()
returns table(slot smallint,church_id uuid,church_name text,city text,assigned_at timestamptz,note text,subscription_discount_percent smallint)
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_app_owner();
  return query select s.slot,s.church_id,coalesce(c.name,s.church_name),c.city,s.assigned_at,s.note,s.subscription_discount_percent
  from private.founding_church_slots s left join public.church_profiles c on c.id=s.church_id
  where s.assigned_at is not null order by s.slot;
end;
$$;
revoke all on function public.list_founding_church_discounts() from public,anon;
grant execute on function public.list_founding_church_discounts() to authenticated;

create function public.assign_founding_church_discount(p_church_id uuid,p_note text)
returns smallint language plpgsql security definer set search_path='' as $$
declare v_slot smallint; v_name text;
begin
  perform private.require_app_owner();
  if p_church_id is null or p_note is null or length(trim(p_note)) not between 1 and 300 then
    raise exception 'invalid_founding_church';
  end if;
  -- Serialize allocation, including retries, so the eleventh church cannot enter.
  lock table private.founding_church_slots in exclusive mode;
  select s.slot into v_slot from private.founding_church_slots s where s.church_id=p_church_id;
  if found then return v_slot; end if;
  select c.name into v_name from public.church_profiles c
    where c.id=p_church_id and c.canonical_church_id is null for update;
  if not found then raise exception 'founding_church_unavailable'; end if;
  if public.resolve_complimentary_access(null,p_church_id,'subscription') then
    raise exception 'church_subscription_already_free';
  end if;
  select s.slot into v_slot from private.founding_church_slots s where s.assigned_at is null order by s.slot limit 1;
  if not found then raise exception 'founding_church_slots_full'; end if;
  update private.founding_church_slots set church_id=p_church_id,church_name=v_name,
    assigned_at=clock_timestamp(),assigned_by=auth.uid(),note=trim(p_note) where slot=v_slot;
  return v_slot;
end;
$$;
revoke all on function public.assign_founding_church_discount(uuid,text) from public,anon;
grant execute on function public.assign_founding_church_discount(uuid,text) to authenticated;

-- Future billing must call this server-side, never trust a client-supplied percent.
-- Free church grants take precedence; founding status never discounts translation.
create function public.resolve_church_discount_percent(p_church_id uuid,p_scope text)
returns integer language plpgsql stable security definer set search_path='' as $$
begin
  if p_scope is null or p_scope not in ('subscription','translation') or p_church_id is null then
    raise exception 'invalid_church_discount_scope';
  end if;
  if not exists(select 1 from public.church_profiles where id=p_church_id and canonical_church_id is null) then
    raise exception 'founding_church_unavailable';
  end if;
  if public.resolve_complimentary_access(null,p_church_id,p_scope) then return 100; end if;
  if p_scope='subscription' and exists(select 1 from private.founding_church_slots where church_id=p_church_id and assigned_at is not null) then return 50; end if;
  return 0;
end;
$$;
revoke all on function public.resolve_church_discount_percent(uuid,text) from public,anon,authenticated;
grant execute on function public.resolve_church_discount_percent(uuid,text) to service_role;
