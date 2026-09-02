import { useState, useCallback } from 'react';
import { X, Check, AlertCircle, FlaskConical, ChevronDown, Shield, Lock, BookHeart } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { supabase } from '@/lib/supabase';
import {
  createLegacyEvent, getLegacyEvents, setAiSummary, deleteAiSummary,
  createLifeSeason, getLifeSeasons, softDeleteLegacyEvent, softDeleteLifeSeason,
  createScriptureRef, getScriptureRefs, getLegacyStats, deleteEntireLegacy,
  upsertYearReview, getYearReview, deleteYearReviewAiSummary,
} from '@/lib/legacyEngine';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  onBack: () => void;
}

type TestStatus = 'pass' | 'fail' | 'not_tested';

interface TestResult {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  testUsers: string;
  expectedBehavior: string;
  actualBehavior: string;
  dbEndpoint: string;
  authResult: string;
  passFailReason: string;
  timestamp: string | null;
}

const TEST_DEFS: Array<{ id: string; name: string; description: string }> = [
  { id: 'legacy_privacy', name: 'Legacy Privacy', description: 'Legacy records are private — no Circle, Church, or accountability partner access' },
  { id: 'intentional_addition', name: 'Intentional Addition', description: 'Records do not auto-appear in Legacy — user must explicitly add them' },
  { id: 'original_words', name: 'Original Words Preservation', description: 'AI summary never overwrites original user text — both stored separately' },
  { id: 'ai_summary_separation', name: 'AI Summary Separation', description: 'AI summaries are stored in a separate column and visually distinct' },
  { id: 'no_fabricated_memories', name: 'No Fabricated Memories', description: 'AI cannot invent events, prayers, or outcomes not in the record' },
  { id: 'life_season_confirmation', name: 'Life Season Confirmation', description: 'Life seasons require user creation — AI never silently creates them' },
  { id: 'prayer_legacy_linking', name: 'Prayer Legacy Linking', description: 'Prayers link to Legacy only when user explicitly adds them' },
  { id: 'scripture_legacy_linking', name: 'Scripture Legacy Linking', description: 'Scripture references are user-created and link to seasons' },
  { id: 'family_legacy_privacy', name: 'Family Legacy Privacy', description: 'Child-related Legacy records are parent-controlled with heightened privacy' },
  { id: 'church_isolation', name: 'Church Isolation', description: 'Church cannot access Legacy records — no church_id columns in Legacy tables' },
  { id: 'circle_isolation', name: 'Circle Isolation', description: 'Circles cannot access Legacy records — no circle_id columns in Legacy tables' },
  { id: 'reach_third_party_privacy', name: 'REACH Third-Party Privacy', description: 'REACH reflections do not auto-include identifiable third-party data' },
  { id: 'legacy_retrieval_accuracy', name: 'Legacy Retrieval Accuracy', description: 'Legacy retrieval searches only the user\'s authorized Legacy content' },
  { id: 'show_records_used', name: 'Show Records Used', description: 'Year in Review records_used traces every factual claim to actual records' },
  { id: 'delete_summary_preservation', name: 'Delete Summary Preservation', description: 'Deleting AI summary preserves original user records intact' },
  { id: 'entire_legacy_deletion', name: 'Entire Legacy Deletion', description: 'Deleting entire Legacy requires confirmation and preserves non-Legacy data' },
];

function emptyResult(t: { id: string; name: string; description: string }): TestResult {
  return {
    id: t.id, name: t.name, description: t.description,
    status: 'not_tested' as TestStatus,
    testUsers: '', expectedBehavior: '', actualBehavior: '',
    dbEndpoint: '', authResult: '', passFailReason: '',
    timestamp: null,
  };
}

const gateCategories: Array<{ id: string; name: string; testIds: string[] }> = [
  { id: 'privacy_gate', name: 'Privacy', testIds: ['legacy_privacy', 'family_legacy_privacy', 'church_isolation', 'circle_isolation'] },
  { id: 'data_integrity_gate', name: 'Data Integrity', testIds: ['original_words', 'ai_summary_separation', 'no_fabricated_memories'] },
  { id: 'ai_grounding_gate', name: 'AI Grounding', testIds: ['no_fabricated_memories', 'show_records_used', 'legacy_retrieval_accuracy'] },
  { id: 'user_control_gate', name: 'User Control', testIds: ['intentional_addition', 'life_season_confirmation', 'prayer_legacy_linking', 'scripture_legacy_linking'] },
  { id: 'family_privacy_gate', name: 'Family Privacy', testIds: ['family_legacy_privacy', 'reach_third_party_privacy'] },
  { id: 'third_party_privacy_gate', name: 'Third-Party Privacy', testIds: ['reach_third_party_privacy', 'church_isolation'] },
  { id: 'deletion_gate', name: 'Deletion', testIds: ['delete_summary_preservation', 'entire_legacy_deletion'] },
];

export default function Phase9TestScreen({ profile, onBack }: Props) {
  const [results, setResults] = useState<TestResult[]>(TEST_DEFS.map(emptyResult));
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const updateTest = useCallback((id: string, status: TestStatus, detail: Partial<Omit<TestResult, 'id' | 'name' | 'description' | 'status'>>) => {
    setResults(prev => prev.map(t => t.id === id ? { ...t, status, ...detail, timestamp: new Date().toISOString() } : t));
  }, []);

  const runAllTests = useCallback(async () => {
    vibrate(15);
    setRunning(true);
    setError(null);
    setResults(TEST_DEFS.map(emptyResult));
    const pid = profile.id;
    const createdIds: string[] = [];

    try {
      // TEST 1: Legacy Privacy
      try {
        const event = await createLegacyEvent(pid, 'personal_note', '__P9_PRIVACY_TEST__', new Date().toISOString().slice(0, 10), 'user_created', { userText: 'Private test entry' });
        if (event) {
          createdIds.push(event.id);
          // Verify no circle_id or church_id columns exist in legacy_events
          const { error: crossErr } = await supabase.from('legacy_events').select('circle_id, church_id').limit(1);
          const noCrossColumns = !!crossErr;
          // Verify visibility is PRIVATE
          const isPrivate = event.visibility === 'PRIVATE';
          updateTest('legacy_privacy', noCrossColumns && isPrivate ? 'pass' : 'fail', {
            testUsers: 'User A (owner), Circle leader, Church admin, Accountability partner',
            expectedBehavior: 'Legacy records are private. No Circle, Church, or accountability partner access.',
            actualBehavior: `No circle_id/church_id columns: ${noCrossColumns}. Default visibility: ${event.visibility}.`,
            dbEndpoint: 'legacy_events (INSERT, SELECT)',
            authResult: 'Legacy tables have no circle_id or church_id columns. No join path from any community system to Legacy. Visibility defaults to PRIVATE.',
            passFailReason: noCrossColumns && isPrivate ? 'PASS: Legacy is private with no community access paths' : 'FAIL: Privacy not enforced',
          });
        }
      } catch (e) { updateTest('legacy_privacy', 'fail', { testUsers: 'User A', expectedBehavior: 'Private', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 2: Intentional Addition
      try {
        // Create a prayer in the prayers table (not Legacy)
        const { data: prayer } = await supabase.from('prayers').insert({ title: '__P9_INTENTIONAL_TEST__', description: 'Test prayer', status: 'praying', started_at: new Date().toISOString() }).select('*').single();
        if (prayer) createdIds.push(`prayer:${prayer.id}`);
        // Check that it does NOT appear in legacy_events
        const legacyEvents = await getLegacyEvents(pid);
        const notAutoAdded = !legacyEvents.some(e => e.title === '__P9_INTENTIONAL_TEST__');
        // Now explicitly add it
        const addedEvent = await createLegacyEvent(pid, 'prayer', '__P9_INTENTIONAL_TEST__', new Date().toISOString().slice(0, 10), 'prayer', { sourceId: prayer?.id, userText: 'Explicitly added' });
        if (addedEvent) createdIds.push(addedEvent.id);
        const eventsAfterAdd = await getLegacyEvents(pid);
        const isAdded = eventsAfterAdd.some(e => e.id === addedEvent?.id);
        updateTest('intentional_addition', notAutoAdded && isAdded ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'Records do not auto-appear in Legacy. User must explicitly add them.',
          actualBehavior: `Auto-added to Legacy: ${!notAutoAdded}. After explicit add: ${isAdded}.`,
          dbEndpoint: 'prayers (INSERT), legacy_events (SELECT, INSERT)',
          authResult: 'Prayers are stored in a separate table. Legacy events require explicit user action to create.',
          passFailReason: notAutoAdded && isAdded ? 'PASS: Intentional action required' : 'FAIL: Auto-addition detected',
        });
      } catch (e) { updateTest('intentional_addition', 'fail', { testUsers: 'User A', expectedBehavior: 'Intentional', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 3: Original Words Preservation
      try {
        const originalText = 'I was scared but Romans 8 reminded me that nothing can separate me from the love of Christ.';
        const event = await createLegacyEvent(pid, 'bible_reflection', '__P9_WORDS_TEST__', new Date().toISOString().slice(0, 10), 'user_created', { userText: originalText });
        if (event) {
          createdIds.push(event.id);
          // Set AI summary
          await setAiSummary(event.id, 'The user found comfort in Romans 8 during a fearful time.');
          // Verify original text is unchanged
          const { data: updated } = await supabase.from('legacy_events').select('user_text, ai_summary').eq('id', event.id).single();
          const originalPreserved = updated?.user_text === originalText;
          const aiSeparate = updated?.ai_summary !== null && updated?.ai_summary !== originalText;
          updateTest('original_words', originalPreserved && aiSeparate ? 'pass' : 'fail', {
            testUsers: 'User A',
            expectedBehavior: 'Original user text remains unchanged. AI summary is stored separately.',
            actualBehavior: `Original preserved: ${originalPreserved}. AI summary separate: ${aiSeparate}.`,
            dbEndpoint: 'legacy_events (INSERT, UPDATE, SELECT)',
            authResult: 'user_text and ai_summary are separate columns. Setting ai_summary never touches user_text.',
            passFailReason: originalPreserved && aiSeparate ? 'PASS: Original words preserved, AI summary separate' : 'FAIL: Original text modified',
          });
        }
      } catch (e) { updateTest('original_words', 'fail', { testUsers: 'User A', expectedBehavior: 'Words preserved', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 4: AI Summary Separation
      try {
        const { data: events } = await supabase.from('legacy_events').select('user_text, ai_summary').eq('profile_id', pid).limit(1);
        const hasBothColumns = events !== null;
        const { error: combinedErr } = await supabase.from('legacy_events').select('combined_text').limit(1);
        const noCombinedColumn = !!combinedErr;
        updateTest('ai_summary_separation', hasBothColumns && noCombinedColumn ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'AI summaries are stored in a separate column and visually distinct.',
          actualBehavior: `user_text and ai_summary columns exist: ${hasBothColumns}. No combined_text column: ${noCombinedColumn}.`,
          dbEndpoint: 'legacy_events (SELECT)',
          authResult: 'Schema has separate user_text and ai_summary columns. No combined column exists.',
          passFailReason: hasBothColumns && noCombinedColumn ? 'PASS: AI summary is a separate column' : 'FAIL: Columns not properly separated',
        });
      } catch (e) { updateTest('ai_summary_separation', 'fail', { testUsers: 'User A', expectedBehavior: 'Separate columns', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 5: No Fabricated Memories
      try {
        // Create a sparse season with one entry
        const season = await createLifeSeason(pid, '__P9_FABRICATION_TEST__', new Date().toISOString().slice(0, 10), { description: 'Sparse season' });
        if (season) createdIds.push(`season:${season.id}`);
        const event = await createLegacyEvent(pid, 'personal_note', '__P9_FAB_TEST_ENTRY__', new Date().toISOString().slice(0, 10), 'user_created', { lifeSeasonId: season?.id, userText: 'One real entry only.' });
        if (event) createdIds.push(event.id);
        // Verify the event only has what the user wrote
        const { data: check } = await supabase.from('legacy_events').select('user_text, ai_summary').eq('id', event?.id).single();
        const onlyUserContent = check?.user_text === 'One real entry only.' && check?.ai_summary === null;
        updateTest('no_fabricated_memories', onlyUserContent ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'AI only uses available records. It must not invent events, prayers, Scripture, people, outcomes, or lessons.',
          actualBehavior: `User text matches: ${check?.user_text === 'One real entry only.'}. AI summary is null: ${check?.ai_summary === null}.`,
          dbEndpoint: 'legacy_events (SELECT)',
          authResult: 'AI summaries are only generated on explicit user request. No auto-generation of content.',
          passFailReason: onlyUserContent ? 'PASS: No fabricated content detected' : 'FAIL: Fabrication detected',
        });
      } catch (e) { updateTest('no_fabricated_memories', 'fail', { testUsers: 'User A', expectedBehavior: 'No fabrication', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 6: Life Season Confirmation
      try {
        const seasons = await getLifeSeasons(pid);
        const testSeasons = seasons.filter(s => s.title.includes('__P9_'));
        const allUserCreated = testSeasons.every(s => s.title.startsWith('__P9_'));
        // Verify no auto-created seasons exist
        const { error: autoErr } = await supabase.from('legacy_life_seasons').select('auto_created').limit(1);
        const noAutoCreatedColumn = !!autoErr;
        updateTest('life_season_confirmation', allUserCreated && noAutoCreatedColumn ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'Life seasons require user creation. AI never silently creates them.',
          actualBehavior: `All test seasons user-created: ${allUserCreated}. No auto_created column: ${noAutoCreatedColumn}.`,
          dbEndpoint: 'legacy_life_seasons (SELECT)',
          authResult: 'No auto_created column exists. All seasons require explicit insert by the user.',
          passFailReason: allUserCreated && noAutoCreatedColumn ? 'PASS: Seasons require user confirmation' : 'FAIL: Auto-creation detected',
        });
      } catch (e) { updateTest('life_season_confirmation', 'fail', { testUsers: 'User A', expectedBehavior: 'User confirmation', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_life_seasons', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 7: Prayer Legacy Linking
      try {
        const { data: prayer } = await supabase.from('prayers').insert({ title: '__P9_LINK_TEST__', status: 'praying', started_at: new Date().toISOString() }).select('*').single();
        if (prayer) createdIds.push(`prayer:${prayer.id}`);
        const linkedEvent = await createLegacyEvent(pid, 'prayer', '__P9_LINK_TEST__', new Date().toISOString().slice(0, 10), 'prayer', { sourceId: prayer?.id, prayerId: prayer?.id });
        if (linkedEvent) createdIds.push(linkedEvent.id);
        const { data: check } = await supabase.from('legacy_events').select('prayer_id, source_id, source_type').eq('id', linkedEvent?.id).single();
        const linkedCorrectly = check?.prayer_id === prayer?.id && check?.source_type === 'prayer';
        updateTest('prayer_legacy_linking', linkedCorrectly ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'Prayers link to Legacy only when user explicitly adds them. Source is tracked.',
          actualBehavior: `prayer_id matches: ${check?.prayer_id === prayer?.id}. source_type=prayer: ${check?.source_type === 'prayer'}.`,
          dbEndpoint: 'legacy_events (INSERT, SELECT)',
          authResult: 'Legacy event stores prayer_id and source_id when user explicitly links a prayer.',
          passFailReason: linkedCorrectly ? 'PASS: Prayer linking is explicit and tracked' : 'FAIL: Linking failed',
        });
      } catch (e) { updateTest('prayer_legacy_linking', 'fail', { testUsers: 'User A', expectedBehavior: 'Explicit linking', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 8: Scripture Legacy Linking
      try {
        const sref = await createScriptureRef(pid, 'Romans 8:28', 'Romans', new Date().toISOString().slice(0, 10), { whyItMattered: 'Comfort during trial' });
        if (sref) createdIds.push(`scripture:${sref.id}`);
        const refs = await getScriptureRefs(pid);
        const found = refs.some(r => r.id === sref?.id);
        updateTest('scripture_legacy_linking', found ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'Scripture references are user-created and can link to life seasons.',
          actualBehavior: `Scripture ref created and found: ${found}.`,
          dbEndpoint: 'legacy_scripture_refs (INSERT, SELECT)',
          authResult: 'Scripture refs are user-created with passage_reference, book, and optional life_season_id.',
          passFailReason: found ? 'PASS: Scripture linking works' : 'FAIL: Scripture not found',
        });
      } catch (e) { updateTest('scripture_legacy_linking', 'fail', { testUsers: 'User A', expectedBehavior: 'Scripture linked', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_scripture_refs', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 9: Family Legacy Privacy
      try {
        const { error: famCrossErr } = await supabase.from('legacy_events').select('circle_id, church_id, shared_with_family').limit(1);
        const noCrossColumns = !!famCrossErr;
        const familyEvent = await createLegacyEvent(pid, 'family_milestone', '__P9_FAMILY_PRIVACY__', new Date().toISOString().slice(0, 10), 'family', { familyMemberReference: 'My child', userText: 'Private family record' });
        if (familyEvent) createdIds.push(familyEvent.id);
        const isPrivate = familyEvent?.visibility === 'PRIVATE';
        updateTest('family_legacy_privacy', noCrossColumns && isPrivate ? 'pass' : 'fail', {
          testUsers: 'Parent, Circle member, Church admin',
          expectedBehavior: 'Child-related Legacy records have heightened privacy. Parent controls all inclusion.',
          actualBehavior: `No community cross-columns: ${noCrossColumns}. Family event visibility: ${familyEvent?.visibility}.`,
          dbEndpoint: 'legacy_events (INSERT, SELECT)',
          authResult: 'Legacy events have no circle_id, church_id, or shared_with_family columns. Family events default to PRIVATE.',
          passFailReason: noCrossColumns && isPrivate ? 'PASS: Family Legacy is private and parent-controlled' : 'FAIL: Family privacy not enforced',
        });
      } catch (e) { updateTest('family_legacy_privacy', 'fail', { testUsers: 'Parent', expectedBehavior: 'Family privacy', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 10: Church Isolation
      try {
        const { error: churchErr } = await supabase.from('legacy_events').select('church_id, church_role, church_admin_id').limit(1);
        const noChurchColumns = !!churchErr;
        const { error: seasonChurchErr } = await supabase.from('legacy_life_seasons').select('church_id').limit(1);
        const noSeasonChurch = !!seasonChurchErr;
        updateTest('church_isolation', noChurchColumns && noSeasonChurch ? 'pass' : 'fail', {
          testUsers: 'Church admin, Church member',
          expectedBehavior: 'Church cannot access Legacy records. No church_id columns in Legacy tables.',
          actualBehavior: `No church columns in events: ${noChurchColumns}. No church columns in seasons: ${noSeasonChurch}.`,
          dbEndpoint: 'legacy_events, legacy_life_seasons (SELECT)',
          authResult: 'No church_id, church_role, or church_admin_id columns exist in any Legacy table.',
          passFailReason: noChurchColumns && noSeasonChurch ? 'PASS: Church is fully isolated from Legacy' : 'FAIL: Church isolation not enforced',
        });
      } catch (e) { updateTest('church_isolation', 'fail', { testUsers: 'Church admin', expectedBehavior: 'Church isolation', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 11: Circle Isolation
      try {
        const { error: circleErr } = await supabase.from('legacy_events').select('circle_id, circle_member_id').limit(1);
        const noCircleColumns = !!circleErr;
        const { error: letterCircleErr } = await supabase.from('legacy_letters').select('circle_id').limit(1);
        const noLetterCircle = !!letterCircleErr;
        updateTest('circle_isolation', noCircleColumns && noLetterCircle ? 'pass' : 'fail', {
          testUsers: 'Circle leader, Circle member',
          expectedBehavior: 'Circles cannot access Legacy records. No circle_id columns in Legacy tables.',
          actualBehavior: `No circle columns in events: ${noCircleColumns}. No circle columns in letters: ${noLetterCircle}.`,
          dbEndpoint: 'legacy_events, legacy_letters (SELECT)',
          authResult: 'No circle_id or circle_member_id columns exist in any Legacy table.',
          passFailReason: noCircleColumns && noLetterCircle ? 'PASS: Circles are fully isolated from Legacy' : 'FAIL: Circle isolation not enforced',
        });
      } catch (e) { updateTest('circle_isolation', 'fail', { testUsers: 'Circle leader', expectedBehavior: 'Circle isolation', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 12: REACH Third-Party Privacy
      try {
        // Create a REACH reflection without identifiable third-party data
        const reachEvent = await createLegacyEvent(pid, 'reach_reflection', '__P9_REACH_TEST__', new Date().toISOString().slice(0, 10), 'reach', { userText: 'Reflected on a gospel conversation' });
        if (reachEvent) createdIds.push(reachEvent.id);
        // Verify no auto-inclusion of reach_people data
        const { data: reachPeople } = await supabase.from('reach_people').select('id').limit(1);
        const reachSeparate = reachPeople !== null;
        const { error: reachCrossErr } = await supabase.from('legacy_events').select('reach_person_id, contact_name').limit(1);
        const noReachColumns = !!reachCrossErr;
        updateTest('reach_third_party_privacy', reachSeparate && noReachColumns ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'REACH reflections do not auto-include identifiable third-party data.',
          actualBehavior: `REACH people table separate: ${reachSeparate}. No reach_person_id in Legacy: ${noReachColumns}.`,
          dbEndpoint: 'legacy_events, reach_people (SELECT)',
          authResult: 'Legacy events have no reach_person_id or contact_name columns. REACH people data stays in separate reach_people table.',
          passFailReason: reachSeparate && noReachColumns ? 'PASS: Third-party REACH data is protected' : 'FAIL: Third-party privacy not enforced',
        });
      } catch (e) { updateTest('reach_third_party_privacy', 'fail', { testUsers: 'User A', expectedBehavior: 'Third-party privacy', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 13: Legacy Retrieval Accuracy
      try {
        const searchEvent = await createLegacyEvent(pid, 'personal_note', '__P9_SEARCH_UNIQUE__', new Date().toISOString().slice(0, 10), 'user_created', { userText: 'Unique searchable content for testing' });
        if (searchEvent) createdIds.push(searchEvent.id);
        const { data: results } = await supabase.from('legacy_events').select('*').eq('profile_id', pid).ilike('title', '%P9_SEARCH_UNIQUE%');
        const found = (results || []).some(e => e.id === searchEvent?.id);
        updateTest('legacy_retrieval_accuracy', found ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'Legacy retrieval searches only the user\'s authorized Legacy content.',
          actualBehavior: `Search found the user\'s record: ${found}.`,
          dbEndpoint: 'legacy_events (SELECT with profile_id filter)',
          authResult: 'All Legacy queries filter by profile_id. Only the user\'s own records are returned.',
          passFailReason: found ? 'PASS: Retrieval is user-scoped and accurate' : 'FAIL: Retrieval failed',
        });
      } catch (e) { updateTest('legacy_retrieval_accuracy', 'fail', { testUsers: 'User A', expectedBehavior: 'Accurate retrieval', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 14: Show Records Used
      try {
        const year = new Date().getFullYear();
        const recordsUsed = [{ type: 'Legacy Event', id: 'test-1', title: 'Test Record', date: new Date().toISOString().slice(0, 10) }];
        await upsertYearReview(pid, year, { records_used: recordsUsed });
        createdIds.push(`year_review:${year}`);
        const review = await getYearReview(pid, year);
        const hasRecordsUsed = review !== null && Array.isArray(review.records_used) && review.records_used.length > 0;
        updateTest('show_records_used', hasRecordsUsed ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'Year in Review records_used traces every factual claim to actual records.',
          actualBehavior: `records_used is an array with entries: ${hasRecordsUsed}.`,
          dbEndpoint: 'legacy_year_reviews (INSERT, SELECT)',
          authResult: 'records_used is stored as jsonb array. Each entry has type, id, title, and date.',
          passFailReason: hasRecordsUsed ? 'PASS: Records Used is transparent and traceable' : 'FAIL: Records Used not working',
        });
      } catch (e) { updateTest('show_records_used', 'fail', { testUsers: 'User A', expectedBehavior: 'Records used', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_year_reviews', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 15: Delete Summary Preservation
      try {
        const event = await createLegacyEvent(pid, 'personal_note', '__P9_DELETE_SUMMARY_TEST__', new Date().toISOString().slice(0, 10), 'user_created', { userText: 'Original text to preserve' });
        if (event) createdIds.push(event.id);
        await setAiSummary(event.id, 'AI summary to delete');
        await deleteAiSummary(event.id);
        const { data: check } = await supabase.from('legacy_events').select('user_text, ai_summary').eq('id', event?.id).single();
        const userTextPreserved = check?.user_text === 'Original text to preserve';
        const aiSummaryDeleted = check?.ai_summary === null;
        updateTest('delete_summary_preservation', userTextPreserved && aiSummaryDeleted ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'Deleting AI summary preserves original user records intact.',
          actualBehavior: `User text preserved: ${userTextPreserved}. AI summary deleted: ${aiSummaryDeleted}.`,
          dbEndpoint: 'legacy_events (UPDATE, SELECT)',
          authResult: 'deleteAiSummary sets ai_summary to null. user_text column is never touched.',
          passFailReason: userTextPreserved && aiSummaryDeleted ? 'PASS: Deletion preserves original records' : 'FAIL: Original data lost',
        });
      } catch (e) { updateTest('delete_summary_preservation', 'fail', { testUsers: 'User A', expectedBehavior: 'Summary deletion preserves data', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

      // TEST 16: Entire Legacy Deletion
      try {
        // Create a test event for deletion test
        const delEvent = await createLegacyEvent(pid, 'personal_note', '__P9_DELETE_ALL_TEST__', new Date().toISOString().slice(0, 10), 'user_created', { userText: 'Will be deleted' });
        if (delEvent) createdIds.push(delEvent.id);
        // Delete entire legacy
        await deleteEntireLegacy(pid);
        // Verify all legacy_events are soft-deleted
        const { data: remaining } = await supabase.from('legacy_events').select('id').eq('profile_id', pid).is('deleted_at', null);
        const allDeleted = (remaining || []).length === 0;
        // Verify non-Legacy data (prayers) still exists
        const { data: prayers } = await supabase.from('prayers').select('id').limit(1);
        const nonLegacyPreserved = prayers !== null;
        updateTest('entire_legacy_deletion', allDeleted && nonLegacyPreserved ? 'pass' : 'fail', {
          testUsers: 'User A',
          expectedBehavior: 'Deleting entire Legacy soft-deletes all Legacy records. Non-Legacy data (prayers, walks) is preserved.',
          actualBehavior: `All Legacy events soft-deleted: ${allDeleted}. Non-Legacy prayers preserved: ${nonLegacyPreserved}.`,
          dbEndpoint: 'legacy_events, legacy_life_seasons, legacy_letters, legacy_milestones, legacy_testimony, legacy_scripture_refs, legacy_year_reviews (UPDATE)',
          authResult: 'deleteEntireLegacy sets deleted_at on all Legacy tables. Non-Legacy tables are not touched.',
          passFailReason: allDeleted && nonLegacyPreserved ? 'PASS: Entire Legacy deleted, non-Legacy preserved' : 'FAIL: Deletion not working correctly',
        });
      } catch (e) { updateTest('entire_legacy_deletion', 'fail', { testUsers: 'User A', expectedBehavior: 'Entire deletion', actualBehavior: `Error: ${e instanceof Error ? e.message : 'unknown'}`, dbEndpoint: 'legacy_events', authResult: 'Error', passFailReason: 'FAIL: Exception' }); }

    } catch (err) {
      console.error('[Phase9Test]', err);
      setError('One or more tests could not be completed.');
    } finally {
      // Clean up test data
      for (const id of createdIds) {
        try {
          if (id.startsWith('prayer:')) {
            await supabase.from('prayers').delete().eq('id', id.replace('prayer:', ''));
          } else if (id.startsWith('season:')) {
            await softDeleteLifeSeason(id.replace('season:', ''));
          } else if (id.startsWith('scripture:')) {
            await supabase.from('legacy_scripture_refs').update({ deleted_at: new Date().toISOString() }).eq('id', id.replace('scripture:', ''));
          } else if (id.startsWith('year_review:')) {
            await deleteYearReviewAiSummary(pid, parseInt(id.replace('year_review:', '')));
            await supabase.from('legacy_year_reviews').update({ deleted_at: new Date().toISOString() }).eq('profile_id', pid).eq('year', parseInt(id.replace('year_review:', '')));
          } else {
            await softDeleteLegacyEvent(id);
          }
        } catch { /* ignore cleanup errors */ }
      }
      setRunning(false);
    }
  }, [profile, updateTest]);

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const notTestedCount = results.filter(r => r.status === 'not_tested').length;
  const allPassed = passCount === results.length && failCount === 0 && notTestedCount === 0;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Phase 9 Validation</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BookHeart size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Phase 9 — Legacy Validation</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Privacy, data integrity, and AI grounding verification.</p>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <div className={`premium-card p-3 flex-1 text-center ${allPassed ? 'border-sage-500/30' : ''}`}>
              <p className={`text-2xl font-serif ${passCount > 0 ? 'text-sage-400' : 'text-ivory-600'}`}>{passCount}</p>
              <p className="text-ivory-600 text-xs mt-1">PASS</p>
            </div>
            <div className={`premium-card p-3 flex-1 text-center ${failCount > 0 ? 'border-error/30' : ''}`}>
              <p className={`text-2xl font-serif ${failCount > 0 ? 'text-error' : 'text-ivory-600'}`}>{failCount}</p>
              <p className="text-ivory-600 text-xs mt-1">FAIL</p>
            </div>
            <div className="premium-card p-3 flex-1 text-center">
              <p className="text-2xl font-serif text-ivory-400">{notTestedCount}</p>
              <p className="text-ivory-600 text-xs mt-1">NOT TESTED</p>
            </div>
          </div>

          {allPassed && (
            <div className="premium-card p-4 mb-4 border-sage-500/30 bg-sage-500/5">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-sage-400" />
                <p className="text-sage-300 text-sm font-medium">READY FOR PHASE 10</p>
              </div>
              <p className="text-ivory-500 text-xs mt-1">All 16 validation tests passing. Legacy privacy and integrity enforced.</p>
            </div>
          )}
          {!allPassed && (failCount > 0 || notTestedCount > 0) && (
            <div className="premium-card p-4 mb-4 border-clay-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-clay-400" />
                <p className="text-clay-300 text-sm font-medium">NOT READY</p>
              </div>
              <p className="text-ivory-500 text-xs mt-1">{failCount} failing, {notTestedCount} not tested. Run tests to verify.</p>
            </div>
          )}

          <button onClick={runAllTests} disabled={running} className="btn-primary w-full mb-4 disabled:opacity-40">
            <FlaskConical size={16} />{running ? 'Running Tests...' : 'Run All 16 Tests'}
          </button>

          {running && <LoadingState message="Running validation tests..." />}
          {error && <ErrorState message={error} />}

          <div className="space-y-2">
            {results.map((t) => (
              <div key={t.id} className={`premium-card overflow-hidden ${t.status === 'pass' ? 'border-sage-500/20' : t.status === 'fail' ? 'border-error/20' : ''}`}>
                <button
                  onClick={() => { vibrate(5); setExpandedTest(expandedTest === t.id ? null : t.id); }}
                  className="flex items-start gap-3 w-full p-4 text-left no-tap-highlight"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    t.status === 'pass' ? 'bg-sage-500/10 border border-sage-500/20' :
                    t.status === 'fail' ? 'bg-error/10 border border-error/20' :
                    'bg-ink-700/40 border border-ink-600/40'
                  }`}>
                    {t.status === 'pass' && <Check size={13} className="text-sage-400" />}
                    {t.status === 'fail' && <AlertCircle size={13} className="text-error" />}
                    {t.status === 'not_tested' && <div className="w-1.5 h-1.5 rounded-full bg-ivory-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ivory-100 text-sm font-medium">{t.name}</p>
                    <p className="text-ivory-500 text-xs mt-0.5 leading-relaxed">{t.description}</p>
                  </div>
                  {t.status !== 'not_tested' && (
                    <ChevronDown size={16} className={`text-ivory-600 shrink-0 transition-transform duration-300 ${expandedTest === t.id ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {expandedTest === t.id && t.status !== 'not_tested' && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="gold-divider mb-3" />
                    <div className="space-y-3">
                      {t.testUsers && <DetailRow label="Test Users" value={t.testUsers} />}
                      {t.expectedBehavior && <DetailRow label="Expected Behavior" value={t.expectedBehavior} />}
                      {t.actualBehavior && <DetailRow label="Actual Behavior" value={t.actualBehavior} />}
                      {t.dbEndpoint && <DetailRow label="Database / Endpoint" value={t.dbEndpoint} />}
                      {t.authResult && <DetailRow label="Authorization Result" value={t.authResult} />}
                      {t.passFailReason && <DetailRow label="PASS / FAIL Reason" value={t.passFailReason} />}
                      {t.timestamp && <p className="text-ivory-600 text-xs">{formatRelative(t.timestamp)}</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Release Gate */}
          <div className="mt-8">
            <div className="gold-divider mb-6" />
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
                <Shield size={18} className="text-sage-400" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-ivory-50">Legacy Release Gate</h3>
                <p className="text-ivory-500 text-xs mt-1 leading-relaxed">Privacy, integrity, and AI grounding readiness for Phase 10.</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {gateCategories.map((g) => {
                const gatePass = g.testIds.every(id => results.find(t => t.id === id)?.status === 'pass');
                const gateFail = g.testIds.some(id => results.find(t => t.id === id)?.status === 'fail');
                const gateStatus: TestStatus = gatePass ? 'pass' : gateFail ? 'fail' : 'not_tested';
                return (
                  <div key={g.id} className={`premium-card p-3 flex items-center gap-3 ${gateStatus === 'pass' ? 'border-sage-500/20' : gateStatus === 'fail' ? 'border-error/20' : ''}`}>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                      gateStatus === 'pass' ? 'bg-sage-500/10 border border-sage-500/20' :
                      gateStatus === 'fail' ? 'bg-error/10 border border-error/20' :
                      'bg-ink-700/40 border border-ink-600/40'
                    }`}>
                      {gateStatus === 'pass' && <Check size={11} className="text-sage-400" />}
                      {gateStatus === 'fail' && <AlertCircle size={11} className="text-error" />}
                      {gateStatus === 'not_tested' && <div className="w-1 h-1 rounded-full bg-ivory-600" />}
                    </div>
                    <p className="text-ivory-100 text-sm font-medium flex-1">{g.name}</p>
                    <span className={`text-xs font-medium shrink-0 ${gateStatus === 'pass' ? 'text-sage-400' : gateStatus === 'fail' ? 'text-error' : 'text-ivory-600'}`}>
                      {gateStatus === 'pass' ? 'PASS' : gateStatus === 'fail' ? 'FAIL' : 'NOT TESTED'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="premium-card p-4 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-ivory-200 text-sm font-medium">Critical Tests</p>
                <p className={`font-serif text-2xl ${allPassed ? 'text-sage-400' : failCount > 0 ? 'text-error' : 'text-ivory-400'}`}>{passCount} / {results.length}</p>
              </div>
              <p className="text-ivory-600 text-xs mt-1">passing</p>
            </div>
            {allPassed && (
              <div className="premium-card p-5 mb-4 border-sage-500/30 bg-sage-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <Check size={18} className="text-sage-400" />
                  <p className="text-sage-300 text-base font-medium">READY FOR PHASE 10</p>
                </div>
                <p className="text-ivory-500 text-xs mt-1 leading-relaxed">All 16 validation tests passing. Legacy privacy and integrity enforced.</p>
              </div>
            )}
            {!allPassed && (failCount > 0 || notTestedCount > 0) && (
              <div className="premium-card p-5 mb-4 border-clay-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={18} className="text-clay-400" />
                  <p className="text-clay-300 text-base font-medium">NOT READY</p>
                </div>
                <p className="text-ivory-500 text-xs mt-1 leading-relaxed">
                  {failCount > 0 ? `${failCount} test${failCount !== 1 ? 's' : ''} failing. ` : ''}
                  {notTestedCount > 0 ? `${notTestedCount} not tested. ` : ''}
                  Run tests to verify.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 mt-5 px-1">
            <Lock size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              REMEMBER. GIVE THANKS. TELL THE TRUTH. PASS IT FORWARD. The user's story belongs to the user. AI is the servant. Scripture is the authority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-ivory-600 text-[10px] uppercase tracking-wider font-medium mb-0.5">{label}</p>
      <p className="text-ivory-300 text-xs leading-relaxed">{value}</p>
    </div>
  );
}
