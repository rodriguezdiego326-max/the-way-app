import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db=new PGlite();
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const pastor=id(1),visitor=id(2),other=id(3),deacon=id(4),church=id(10),otherChurch=id(11),group=id(20),study=id(21);
await db.exec(readFileSync('scripts/fixtures/church-membership-before191.sql','utf8'));
await db.query('insert into profiles values ($1,\'Pastor\'),($2,\'Visitor\'),($3,\'Other\'),($4,\'Deacon\')',[pastor,visitor,other,deacon]);
await db.query('insert into church_profiles(id,name,user_id) values($1,\'Grace\',$2),($3,\'Other\',null)',[church,visitor,otherChurch]);
await db.query("insert into church_memberships(id,profile_id,church_id,personal_role,verified_church_role) values($1,$1,$5,'Pastor','PASTOR'),($2,$2,$5,'Member',null),($3,$3,$6,'Pastor','PASTOR'),($4,$4,$5,'Deacon',null)",[pastor,visitor,other,deacon,church,otherChurch]);
await db.exec(readFileSync('supabase/migrations/20261128052211_church_member_invitations.sql','utf8'));
await db.exec(`create table private.app_admins(profile_id uuid primary key,role text,active boolean default true);
revoke all on private.app_admins from public,anon,authenticated;`);
await db.exec(readFileSync('supabase/migrations/20261128053650_app_owner_church_access.sql','utf8'));

await db.query("insert into church_groups values($1,$2,$3,'Group');",[group,church,pastor]);
await db.query("insert into private.church_group_invites values($1,'TESTCODE',now())",[group]);
await db.query("insert into church_studies values($1,$2,'published','Study')",[study,church]);
await db.query('insert into church_study_assignments values($1,$2)',[id(22),study]);
await db.query("insert into church_prayer_items values($1,$2,'Prayer')",[id(23),church]);
await db.query('insert into group_discussions values($1,$2,$3)',[id(24),group,pastor]);
// An old group membership must not bypass the new church membership gate.
await db.query('insert into church_group_memberships(group_id,profile_id) values($1,$2)',[group,visitor]);
const asUser=async(uid,sql,params=[])=>{await db.exec('set role authenticated');await db.query("select set_config('test.uid',$1,false)",[uid]);try{return await db.query(sql,params);}finally{await db.exec('reset role');}};
const count=async(uid,table)=>(await asUser(uid,`select count(*)::int n from ${table}`)).rows[0].n;
test('only verified leaders retain membership; title and church ownership grant no member access',async()=>{
 assert.equal((await asUser(visitor,'select membership_status from church_memberships')).rows[0].membership_status,'visitor');
 for(const table of ['church_studies','church_study_assignments','church_prayer_items','church_groups','group_discussions']) assert.equal(await count(visitor,table),0,table);
 assert.equal(await count(pastor,'church_studies'),1);
 await assert.rejects(asUser(visitor,"update church_memberships set membership_status='member'"),/permission denied/);
 await assert.rejects(asUser(visitor,"update church_memberships set verified_church_role='PASTOR'"),/permission denied/);
 await asUser(visitor,"update church_memberships set personal_role='Pastor'");
 assert.equal(await count(visitor,'church_prayer_items'),0);
 await assert.rejects(asUser(visitor,"insert into church_prayer_items values($1,$2,'Bad')",[id(30),church]),/row-level security/);
 await assert.rejects(asUser(visitor,"select * from join_church_group_by_code('TESTCODE')"),/must belong/);
});
test('only this church pastor/admin can invite; lists do not expose other church users',async()=>{
 await assert.rejects(asUser(visitor,'select invite_church_member($1)',[visitor]),/pastor or church admin/);
 await assert.rejects(asUser(other,'select invite_church_member($1)',[visitor]),/pastor or church admin/);
 assert.equal((await asUser(visitor,'select * from list_church_membership_connections($1)',[church])).rows.length,1);
 assert.equal((await asUser(other,'select * from list_church_membership_connections($1)',[church])).rows.length,0);
 await asUser(pastor,'select invite_church_member($1)',[visitor]);
 await asUser(pastor,'select invite_church_member($1)',[visitor]);
 assert.equal((await db.query("select count(*)::int n from private.church_member_invitations where status='pending'")).rows[0].n,1);
});
test('only recipient can accept; acceptance unlocks member content and cannot be replayed',async()=>{
 const inv=(await asUser(visitor,'select * from list_church_membership_connections($1)',[church])).rows[0].invitation_id;
 await assert.rejects(asUser(other,'select respond_church_member_invitation($1,true)',[inv]),/unavailable/);
 assert.equal(await count(visitor,'church_studies'),0);
 await asUser(visitor,'select respond_church_member_invitation($1,true)',[inv]);
 for(const table of ['church_studies','church_study_assignments','church_prayer_items','church_groups','group_discussions']) assert.equal(await count(visitor,table),1,table);
 await assert.rejects(asUser(visitor,'select respond_church_member_invitation($1,true)',[inv]),/already answered/);
 await assert.rejects(asUser(visitor,'select invite_church_member($1)',[deacon]),/pastor or church admin/);
});
test('declined, canceled, expired invitations never grant access; leaving and readding starts as visitor',async()=>{
 await asUser(pastor,'select invite_church_member($1)',[deacon]);
 let inv=(await asUser(deacon,'select * from list_church_membership_connections($1)',[church])).rows[0].invitation_id;
 await asUser(deacon,'select respond_church_member_invitation($1,false)',[inv]);
 assert.equal(await count(deacon,'church_studies'),0);
 await asUser(pastor,'select invite_church_member($1)',[deacon]);
 inv=(await asUser(deacon,'select * from list_church_membership_connections($1)',[church])).rows[0].invitation_id;
 await asUser(pastor,'select revoke_church_member_invitation($1)',[deacon]);
 await assert.rejects(asUser(deacon,'select respond_church_member_invitation($1,true)',[inv]),/already answered/);
 await asUser(pastor,'select invite_church_member($1)',[deacon]);
 await db.exec("update private.church_member_invitations set expires_at=now()-interval '1 day' where status='pending'");
 const expired=(await db.query("select id from private.church_member_invitations where status='pending'")).rows[0].id;
 await assert.rejects(asUser(deacon,'select respond_church_member_invitation($1,true)',[expired]),/expired/);
 await asUser(visitor,'delete from church_memberships');
 await asUser(visitor,"insert into church_memberships(profile_id,church_id,personal_role) values($1,$2,'Member')",[visitor,church]);
 assert.equal(await count(visitor,'church_studies'),0);
});
test('Deacon requests require leader approval, allow prayer/groups but not pastor publishing or member invitations',async()=>{
 await asUser(deacon,"insert into church_admin_claims(church_id,requested_role) values($1,'DEACON')",[church]);
 const claim=(await asUser(pastor,'select * from list_church_role_claims_for_delegation($1)',[church])).rows[0].claim_id;
 await assert.rejects(asUser(deacon,"select review_church_role_claim_as_leader($1,'approved')",[claim]),/authorized/);
 await asUser(pastor,"select review_church_role_claim_as_leader($1,'approved')",[claim]);
 assert.equal((await asUser(deacon,'select verified_church_role,membership_status from church_memberships')).rows[0].verified_church_role,'DEACON');
 assert.equal(await count(deacon,'church_groups'),1);
 await asUser(deacon,"insert into church_prayer_items values($1,$2,'Deacon prayer')",[id(31),church]);
 await assert.rejects(asUser(deacon,"insert into church_studies values($1,$2,'published','Bad')",[id(32),church]),/row-level security/);
 const target=(await db.query('select id from church_memberships where profile_id=$1',[visitor])).rows[0].id;
 await assert.rejects(asUser(deacon,'select invite_church_member($1)',[target]),/pastor or church admin/);
});
test('anonymous and direct invitation table access are denied',async()=>{
 await assert.rejects(asUser(visitor,'select * from private.church_member_invitations'),/permission denied/);
 await db.exec('set role anon');
 try { await assert.rejects(db.query('select invite_church_member($1)',[visitor]),/permission denied/); } finally {await db.exec('reset role');}
});

test('church admins can invite; loss of sender authorization invalidates pending acceptance',async()=>{
 const target=(await db.query('select id from church_memberships where profile_id=$1',[visitor])).rows[0].id;
 await db.query("update church_memberships set verified_church_role='CHURCH_ADMIN' where profile_id=$1",[deacon]);
 await asUser(deacon,'select invite_church_member($1)',[target]);
 const inv=(await asUser(visitor,'select * from list_church_membership_connections($1)',[church])).rows[0].invitation_id;
 await db.query("update church_memberships set verified_church_role='DEACON' where profile_id=$1",[deacon]);
 await assert.rejects(asUser(visitor,'select respond_church_member_invitation($1,true)',[inv]),/current pastor or church admin/);
 assert.equal(await count(visitor,'church_studies'),0);
 await assert.rejects(asUser(visitor,"insert into church_memberships(profile_id,church_id,personal_role,membership_status) values($1,$2,'Member','member')",[visitor,otherChurch]),/permission denied/);
});

test('active App Owner has full church access without membership or a pastor title',async()=>{
 const owner=id(50);
 await db.query("insert into profiles values($1,'App Owner')",[owner]);
 await db.query("insert into private.app_admins values($1,'APP_OWNER',true)",[owner]);
 for(const table of ['church_studies','church_study_assignments','church_groups','group_discussions']) assert.ok(await count(owner,table)>0,table);
 assert.ok(await count(owner,'church_prayer_items')>0);
 assert.equal((await asUser(owner,'select private.can_delegate_church_role($1) ok',[church])).rows[0].ok,true);
 await asUser(owner,"insert into church_studies values($1,$2,'draft','Owner study')",[id(51),church]);
 await asUser(owner,"insert into church_prayer_items values($1,$2,'Owner prayer')",[id(52),church]);
 await asUser(owner,"insert into church_groups values($1,$2,$3,'Owner group')",[id(53),church,owner]);
 await asUser(owner,"update church_prayer_items set title='Updated' where id=$1",[id(52)]);
 await asUser(owner,"delete from church_prayer_items where id=$1",[id(52)]);
 const target=(await db.query('select id from church_memberships where profile_id=$1',[visitor])).rows[0].id;
 await asUser(owner,'select revoke_church_member_invitation($1)',[target]);
 await asUser(owner,'select invite_church_member($1)',[target]);
 const inv=(await asUser(visitor,'select * from list_church_membership_connections($1)',[church])).rows[0].invitation_id;
 await asUser(visitor,'select respond_church_member_invitation($1,true)',[inv]);
 assert.equal((await asUser(visitor,'select membership_status from church_memberships')).rows[0].membership_status,'member');
 assert.equal((await db.query('select count(*)::int n from church_memberships where profile_id=$1',[owner])).rows[0].n,0);
 assert.equal((await asUser(owner,'select get_church_group_invite_code($1) code',[group])).rows[0].code,'TESTCODE');
 await asUser(owner,'select delete_owned_church_group($1)',[group]);
 assert.equal((await db.query('select count(*)::int n from church_groups where id=$1',[group])).rows[0].n,0);
});
test('App Admin, inactive owner, and self-selected titles cannot acquire the owner exception',async()=>{
 const admin=id(60),inactive=id(61);
 await db.query("insert into profiles values($1,'Admin'),($2,'Inactive')",[admin,inactive]);
 await db.query("insert into private.app_admins values($1,'APP_ADMIN',true),($2,'APP_OWNER',false)",[admin,inactive]);
 for(const actor of [admin,inactive]) {
  assert.equal(await count(actor,'church_studies'),0);
  assert.equal((await asUser(actor,'select private.can_delegate_church_role($1) ok',[church])).rows[0].ok,false);
  await assert.rejects(asUser(actor,"update private.app_admins set role='APP_OWNER',active=true"),/permission denied/);
 }
 await db.query('update private.app_admins set active=false where profile_id=$1',[id(50)]);
 assert.equal(await count(id(50),'church_studies'),0);
 const target=(await db.query('select id from church_memberships where profile_id=$1',[deacon])).rows[0].id;
 await assert.rejects(asUser(id(50),'select invite_church_member($1)',[target]),/pastor or church admin/);
});
