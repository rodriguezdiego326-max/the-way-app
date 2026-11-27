import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const ids = ['11111111','22222222','33333333','44444444','55555555'].map(x => `${x}-1111-4111-8111-111111111111`);
const [owner, admin, listener, stranger, church] = ids;
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema private; create schema auth;
create table public.profiles(id uuid primary key,display_name text);
create table public.church_profiles(id uuid primary key,name text,city text);
create table public.church_memberships(profile_id uuid,church_id uuid);
create table auth.users(id uuid primary key,email text);
create table private.app_admins(profile_id uuid,role text,active boolean);
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
grant usage on schema auth to authenticated,service_role,anon;
insert into public.profiles values ('${owner}','Owner'),('${admin}','Admin'),('${listener}','Pastor'),('${stranger}','Member');
insert into auth.users values ('${listener}','pastor@example.test');
insert into public.church_profiles values ('${church}','Test Church','Houston');
insert into private.app_admins values ('${owner}','APP_OWNER',true),('${admin}','APP_ADMIN',true);
`);
await db.exec(readFileSync('supabase/migrations/20261127222022_translation_measurement_and_grants.sql','utf8'));
const asUser = async (id, sql, params=[]) => {
  await db.exec('set role authenticated');
  await db.query("select set_config('test.uid',$1,false)",[id]);
  try { return await db.query(sql,params); } finally { await db.exec('reset role'); }
};
const register = async () => {
  await db.exec('set role service_role');
  try { return (await db.query('select public.register_translation_measurement($1,$2,$3,$4) as id',[listener,church,'church','test-room'])).rows[0].id; }
  finally { await db.exec('reset role'); }
};
const pulse = (id, seq, state, who=listener) => asUser(who,'select public.observe_translation($1,$2,$3)',[id,seq,state]);

test('ordinary users cannot mint observations for arbitrary sessions or read raw telemetry',async()=>{
  await assert.rejects(asUser(listener,'select public.register_translation_measurement($1,$2,$3,$4)',[listener,church,'church','fake']),/permission denied/);
  await assert.rejects(asUser(listener,'select * from private.translation_connections'),/permission denied/);
  const id=await register();
  await assert.rejects(pulse(id,0,'playing',stranger),/connection_not_found/);
  await assert.rejects(pulse(id,-1,'playing'),/invalid_observation/);
});
test('server timestamps cap missed heartbeats; replay and late packets do not add time',async()=>{
  const id=await register(); await pulse(id,0,'playing');
  await db.query("update private.translation_connections set last_seen=clock_timestamp()-interval '2 hours' where id=$1",[id]);
  await pulse(id,1,'failed');
  let rows=(await db.query('select extract(epoch from upper(observed_range)-lower(observed_range)) as seconds from private.translation_observations where connection_id=$1',[id])).rows;
  assert.equal(Number(rows[0].seconds),30);
  await pulse(id,1,'playing'); await pulse(id,0,'playing');
  assert.equal((await db.query('select state from private.translation_connections where id=$1',[id])).rows[0].state,'failed');
  await pulse(id,2,'closed'); await pulse(id,3,'playing');
  assert.equal((await db.query('select count(*) as n from private.translation_observations where connection_id=$1',[id])).rows[0].n,1);
  assert.equal((await db.query('select state from private.translation_connections where id=$1',[id])).rows[0].state,'closed');
});
test('waiting and expired connections produce no observed usage',async()=>{
  const id=await register(); await pulse(id,0,'waiting'); await pulse(id,1,'failed');
  await db.query("update private.translation_connections set expires_at=clock_timestamp()-interval '1 minute' where id=$1",[id]);
  await pulse(id,2,'playing');
  assert.equal((await db.query('select count(*) as n from private.translation_observations where connection_id=$1',[id])).rows[0].n,0);
});
test('summary unions overlapping devices and reconnects, clips windows, separates microphone',async()=>{
  const a=await register(),b=await register();
  await db.query("insert into private.translation_observations values($1,1,tstzrange('2026-11-27 10:00Z','2026-11-27 10:01Z'),'playing'),($2,1,tstzrange('2026-11-27 10:00:30Z','2026-11-27 10:01:30Z'),'connected')",[a,b]);
  const mic=(await db.query('select public.register_translation_measurement($1,null,$2,null) as id',[listener,'microphone'])).rows[0].id;
  await db.query("insert into private.translation_observations values($1,1,tstzrange('2026-11-27 10:00Z','2026-11-27 10:01Z'),'connected')",[mic]);
  const args=['2026-11-27 10:00:15Z','2026-11-27 10:02Z'];
  const rows=(await asUser(owner,'select * from public.translation_measurement_summary($1,$2)',args)).rows;
  assert.equal(rows.length,2);
  assert.equal(Number(rows.find(r=>r.mode==='microphone').connected_seconds),45);
  const row=rows.find(r=>r.mode==='church');
  assert.equal(Number(row.connected_seconds),75); assert.equal(Number(row.playback_seconds),45); assert.equal(row.people,1);
  await assert.rejects(asUser(admin,'select * from public.translation_measurement_summary($1,$2)',args),/app_owner_required/);
  await assert.rejects(asUser(owner,'select * from public.translation_measurement_summary($1,$2)',['2026-01-01','2026-11-27']),/invalid_window/);
});
test('only App Owner can search or grant; grants resolve server-side and revoke without changing observed usage',async()=>{
  const args=['person',listener,'full',true,'Pastor gift'];
  for (const actor of [admin,listener,stranger]) {
    await assert.rejects(asUser(actor,'select public.set_complimentary_access($1,$2,$3,$4,$5)',args),/app_owner_required/);
    await assert.rejects(asUser(actor,'select * from public.search_complimentary_targets($1,$2)',['person','pastor']),/app_owner_required/);
  }
  assert.equal((await asUser(owner,'select * from public.search_complimentary_targets($1,$2)',['person','pastor@example.test'])).rows[0].id,listener);
  await asUser(owner,'select public.set_complimentary_access($1,$2,$3,$4,$5)',args);
  await db.exec('set role service_role');
  assert.equal((await db.query('select public.resolve_complimentary_access($1,$2,$3) as yes',[listener,null,'translation'])).rows[0].yes,true);
  await db.exec('reset role');
  assert.equal((await db.query('select public.resolve_complimentary_access($1,$2,$3) as yes',[listener,church,'translation'])).rows[0].yes,false);
  await asUser(owner,'select public.set_complimentary_access($1,$2,$3,$4,$5)',['person',listener,'full',false,'Revoked']);
  assert.equal((await asUser(owner,'select * from public.list_complimentary_access()')).rows[0].active,false);
  assert.equal((await db.query('select count(*) as n from private.complimentary_access_audit')).rows[0].n,2);
  await db.exec('set role service_role');
  assert.equal((await db.query('select public.resolve_complimentary_access($1,$2,$3) as yes',[listener,null,'translation'])).rows[0].yes,false);
  await db.exec('reset role');
  await assert.rejects(asUser(listener,'select public.resolve_complimentary_access($1,$2,$3)',[listener,null,'translation']),/permission denied/);
});
test('a church gift does not grant personal subscription access',async()=>{
  await asUser(owner,'select public.set_complimentary_access($1,$2,$3,$4,$5)',['church',church,'full',true,'Home church']);
  assert.equal((await db.query('select public.resolve_complimentary_access($1,$2,$3) as yes',[stranger,church,'translation'])).rows[0].yes,true);
  assert.equal((await db.query('select public.resolve_complimentary_access($1,$2,$3) as yes',[stranger,null,'subscription'])).rows[0].yes,false);
});

const bundle=await build({entryPoints:['shared/translationUsageReporter.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {createUsageReporter}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('reporter serializes overlapping sends, bounds pending work, closes exactly once',async()=>{
  const sent=[];let release;let timer;let cancelled=0;
  const reporter=createUsageReporter(async(seq,state)=>{sent.push([seq,state]);if(seq===0) await new Promise(resolve=>{release=resolve;});},fn=>{timer=fn;return 1;},()=>cancelled++);
  reporter.setState('playing'); for(let i=0;i<20;i++)timer(); reporter.stop(); reporter.stop(); reporter.setState('playing');
  assert.deepEqual(sent,[[0,'waiting']]); release(); await tick();
  assert.deepEqual(sent,[[0,'waiting'],[1,'closed']]);assert.equal(cancelled,1);
});
test('reporter recovers from failed telemetry without affecting playback caller',async()=>{
  const sent=[];let timer;
  const reporter=createUsageReporter(async(seq,state)=>{sent.push([seq,state]);if(seq===0)throw Error('offline');},fn=>{timer=fn;return 1;},()=>{});
  await tick();reporter.setState('playing');await tick();timer();await tick();reporter.stop();await tick();
  assert.deepEqual(sent,[[0,'waiting'],[1,'playing'],[2,'playing'],[3,'closed']]);
});
test.after(async()=>{await db.close();});

// Exercise the actual listener integration, including failed autoplay and reconnects.
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<body></body>');
globalThis.document=dom.window.document;
let room, playbackAllowed=true, states=[], stopped=0;
class FakeRoom {
  constructor(){room=this;this.handlers={};this.remoteParticipants=new Map();this.canPlaybackAudio=true;}
  on(event,fn){(this.handlers[event] ||= []).push(fn);}
  emit(event,...args){for(const fn of this.handlers[event]||[])fn(...args);}
  registerTextStreamHandler(){} unregisterTextStreamHandler(){}
  async connect(){} async startAudio(){}
  async disconnect(){this.emit('Disconnected');}
}
const events=Object.fromEntries(['TrackPublished','TrackSubscribed','TrackUnsubscribed','AudioPlaybackStatusChanged','ParticipantAttributesChanged','DataReceived','ParticipantConnected','Disconnected','Reconnecting','Reconnected'].map(k=>[k,k]));
globalThis.__measurementListenerTest={Room:FakeRoom,RoomEvent:events,Track:{Kind:{Audio:'audio'}},startTranslationMeasurement:()=>({setState:s=>states.push(s),stop:()=>stopped++}),getChurchLiveListenerToken:async()=>null};
const listenerBundle=await build({entryPoints:['src/lib/churchLiveListener.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'listener-mocks',setup(b){
  b.onResolve({filter:/^(livekit-client|@\/lib\/(translationMeasurement|churchLiveTranslationEngine))$/},()=>({path:'mock',namespace:'test'}));
  b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const {Room,RoomEvent,Track,startTranslationMeasurement,getChurchLiveListenerToken}=globalThis.__measurementListenerTest;'}));
}}]});
const {startChurchLiveListenerFromConnection}=await import('data:text/javascript;base64,'+Buffer.from(listenerBundle.outputFiles[0].text).toString('base64'));
function audioTrack(){
  const audio=document.createElement('audio');let paused=true;
  Object.defineProperty(audio,'paused',{get:()=>paused});Object.defineProperty(audio,'readyState',{get:()=>2});
  audio.play=async()=>{if(!playbackAllowed)throw Error('autoplay');paused=false;audio.dispatchEvent(new dom.window.Event('playing'));};
  return {kind:'audio',attach:()=>audio,detach:()=>[audio]};
}
test('listener telemetry distinguishes failed autoplay, playback, reconnect and service failure',async()=>{
  states=[];stopped=0;playbackAllowed=false;
  const session=await startChurchLiveListenerFromConnection({url:'wss://test',token:'test',roomName:'room',measurementId:'id'},'source',{});
  const agent={isAgent:true,attributes:{}};
  room.emit('TrackSubscribed',audioTrack(),{},agent);await tick();
  assert.ok(!states.includes('playing'));
  playbackAllowed=true;await session.startAudio();assert.equal(states.at(-1),'playing');
  document.querySelector('audio').dispatchEvent(new dom.window.Event('waiting'));assert.equal(states.at(-1),'connected');
  document.querySelector('audio').dispatchEvent(new dom.window.Event('playing'));assert.equal(states.at(-1),'playing');
  room.emit('Reconnecting');assert.equal(states.at(-1),'waiting');
  room.emit('Reconnected');assert.equal(states.at(-1),'playing');
  room.emit('ParticipantAttributesChanged',{}, {...agent,attributes:{'solapath.translation.status':'error'}});
  assert.equal(states.at(-1),'failed');
  await session.stop();assert.ok(stopped>0);
});
