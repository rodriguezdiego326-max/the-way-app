import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
await db.exec(`create role anon; create role authenticated; create role service_role;
create schema auth; create schema private;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
grant usage on schema auth,private,public to anon,authenticated,service_role;
create table public.profiles(id uuid primary key);
create table public.church_profiles(id uuid primary key,name text not null,city text,canonical_church_id uuid);
create table private.app_admins(profile_id uuid,role text,active boolean);
create table private.complimentary_access(profile_id uuid,church_id uuid,scope text,active boolean);
create function private.require_app_owner() returns void language plpgsql security definer set search_path='' as $$
begin if not exists(select 1 from private.app_admins where profile_id=auth.uid() and role='APP_OWNER' and active) then raise exception 'app_owner_required'; end if; end; $$;
revoke all on function private.require_app_owner() from public,anon,authenticated;
create function public.resolve_complimentary_access(p_profile_id uuid,p_church_id uuid,p_scope text)
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from private.complimentary_access g where p_scope in ('subscription','translation','full') and g.active and (g.scope=p_scope or g.scope='full')
and ((p_church_id is null and g.profile_id=p_profile_id) or (p_church_id is not null and g.church_id=p_church_id))); $$;
revoke all on function public.resolve_complimentary_access(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.resolve_complimentary_access(uuid,uuid,text) to service_role;`);
for (let n=1;n<=4;n++) await db.query('insert into profiles values($1)',[id(n)]);
await db.query("insert into private.app_admins values($1,'APP_OWNER',true),($2,'APP_ADMIN',true),($3,'APP_OWNER',false)",[id(1),id(2),id(3)]);
for (let n=10;n<=25;n++) await db.query('insert into church_profiles values($1,$2,\'Pearland\',null)',[id(n),`Church ${n}`]);
const migration = readdirSync('supabase/migrations').find(p => p.endsWith('_founding_church_subscription_discount.sql'));
await db.exec(readFileSync(`supabase/migrations/${migration}`,'utf8'));
const asRole = async (role,uid,sql,params=[])=>{
 await db.exec(`set role ${role}`); await db.query("select set_config('test.uid',$1,false)",[uid || '']);
 try{return await db.query(sql,params);}finally{await db.exec('reset role');}
};
const owner=(sql,params=[])=>asRole('authenticated',id(1),sql,params);
const assign=church=>owner("select assign_founding_church_discount($1,'Founding church') slot",[church]);
const discount=async(church,scope)=>(await asRole('service_role',null,'select resolve_church_discount_percent($1,$2) percent',[church,scope])).rows[0].percent;

test('only active App Owner can list or allocate; raw tables and pricing resolver are private',async()=>{
 for(const uid of [id(2),id(3),id(4),null]) {
  await assert.rejects(asRole('authenticated',uid,'select * from list_founding_church_discounts()'),/app_owner_required/);
  await assert.rejects(asRole('authenticated',uid,"select assign_founding_church_discount($1,'test')",[id(10)]),/app_owner_required/);
 }
 for(const role of ['anon','authenticated']) {
  await assert.rejects(asRole(role,id(1),'select * from private.founding_church_slots'),/permission denied/);
  await assert.rejects(asRole(role,id(1),"update private.founding_church_slots set subscription_discount_percent=100"),/permission denied/);
  await assert.rejects(asRole(role,id(1),"select resolve_church_discount_percent($1,'subscription')",[id(10)]),/permission denied/);
 }
 await assert.rejects(asRole('anon',id(1),'select * from list_founding_church_discounts()'),/permission denied/);
 assert.equal((await db.query("select relrowsecurity from pg_class where oid='private.founding_church_slots'::regclass")).rows[0].relrowsecurity,true);
});
test('owner allocation persists identity, note and immutable time; retries use the same slot',async()=>{
 assert.equal((await assign(id(10))).rows[0].slot,1);
 const before=(await owner('select * from list_founding_church_discounts()')).rows[0];
 await owner("select assign_founding_church_discount($1,'Changed note')",[id(10)]);
 const rows=(await owner('select * from list_founding_church_discounts()')).rows;
 assert.equal(rows.length,1); assert.deepEqual(rows[0],before);
 assert.equal(before.subscription_discount_percent,50);assert.equal(before.note,'Founding church');
 assert.equal((await db.query('select assigned_by from private.founding_church_slots where slot=1')).rows[0].assigned_by,id(1));
});
test('subscription-only benefit leaves translation and other churches at standard pricing',async()=>{
 assert.equal(await discount(id(10),'subscription'),50);
 assert.equal(await discount(id(10),'translation'),0);
 assert.equal(await discount(id(11),'subscription'),0);
 await assert.rejects(discount(id(10),'full'),/invalid_church_discount_scope/);
 await assert.rejects(discount(null,'subscription'),/invalid_church_discount_scope/);
 await db.query('insert into private.complimentary_access values($1,null,\'full\',true)',[id(1)]);
 assert.equal(await discount(id(11),'subscription'),0,'personal grant must not discount a church');
});
test('church free access wins over 50%, never stacks, and revocation restores lifetime eligibility',async()=>{
 await db.query("insert into private.complimentary_access values(null,$1,'full',true)",[id(10)]);
 assert.equal(await discount(id(10),'subscription'),100); assert.equal(await discount(id(10),'translation'),100);
 await db.query('update private.complimentary_access set active=false where church_id=$1',[id(10)]);
 assert.equal(await discount(id(10),'subscription'),50);assert.equal(await discount(id(10),'translation'),0);
});
test('invalid, duplicate archived records and already-free churches consume no slots',async()=>{
 await db.query('update church_profiles set canonical_church_id=$1 where id=$2',[id(10),id(23)]);
 await db.query("insert into private.complimentary_access values(null,$1,'subscription',true)",[id(24)]);
 await assert.rejects(assign(id(23)),/unavailable/);await assert.rejects(assign(id(24)),/already_free/);
 await assert.rejects(assign(id(99)),/unavailable/);
 for(const note of ['', ' ', null, 'x'.repeat(301)]) await assert.rejects(owner('select assign_founding_church_discount($1,$2)',[id(11),note]),/invalid/);
 assert.equal((await owner('select * from list_founding_church_discounts()')).rows.length,1);
});
test('translation-only free grants do not consume or prevent a subscription discount',async()=>{
 await db.query("insert into private.complimentary_access values(null,$1,'translation',true)",[id(11)]);
 assert.equal((await assign(id(11))).rows[0].slot,2);
 assert.equal(await discount(id(11),'subscription'),50);assert.equal(await discount(id(11),'translation'),100);
});
test('ten-slot limit is enforced by the database and duplicate retry works even when full',async()=>{
 for(let n=12;n<=19;n++) await assign(id(n));
 assert.equal((await owner('select * from list_founding_church_discounts()')).rows.length,10);
 await assert.rejects(assign(id(20)),/slots_full/);
 assert.equal((await assign(id(10))).rows[0].slot,1);
 await assert.rejects(db.query('insert into private.founding_church_slots(slot) values(11)'),/check constraint/);
});
test('deleted church does not recycle a lifetime slot; identity and audit details are retained',async()=>{
 await db.query('delete from church_profiles where id=$1',[id(19)]);
 const rows=(await owner('select * from list_founding_church_discounts()')).rows;
 assert.equal(rows.length,10);assert.equal(rows[9].church_id,null);assert.equal(rows[9].church_name,'Church 19');
 await assert.rejects(assign(id(20)),/slots_full/);
});
