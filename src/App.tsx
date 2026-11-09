import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Walk } from '@/lib/types';
import type { OnboardingData } from '@/components/Onboarding';
import SplashScreen from '@/components/SplashScreen';
import Onboarding from '@/components/Onboarding';
import BottomNav, { type Tab } from '@/components/BottomNav';
import TodayScreen from '@/screens/TodayScreen';
import BibleScreen from '@/screens/BibleScreen';
import BibleModeScreen from '@/screens/BibleModeScreen';
import { parsePassageReference } from '@/lib/passageParser';
import AskScreen from '@/screens/AskScreen';
import PrayerScreen from '@/screens/PrayerScreen';
import YouScreen from '@/screens/YouScreen';
import ProfileHubScreen from '@/screens/ProfileHubScreen';
import FamilyScreen from '@/screens/FamilyScreen';
import ReachScreen from '@/screens/ReachScreen';
import LibrarySearchScreen from '@/screens/LibrarySearchScreen';
import { isDevOverlayType } from '@/lib/devOverlayTypes';
import ErrorBoundary from '@/components/ErrorBoundary';
import WelcomeScreen from '@/components/WelcomeScreen';
import BrandMark from '@/components/BrandMark';
import type { BibleTranslation } from '@/lib/bibleTypes';
import type { AskHandoffContext, ChildAskedHandoff, SermonAskHandoff } from '@/lib/askHandoff';
import { OPEN_SERMON_RECORDER_EVENT } from '@/hooks/sermonRecordingContext';

const DevOverlayRenderer = import.meta.env.DEV
  ? lazy(() => import('@/components/DevOverlayRenderer'))
  : null;

function getInitialTranslation(): BibleTranslation {
  if (typeof localStorage === 'undefined') return 'WEB';
  const saved = localStorage.getItem('solapath_translation');
  return saved === 'RV1909' ? 'RV1909' : 'WEB';
}

// Phase 8 imports
import TogetherScreen from '@/screens/TogetherScreen';
import JoinCircleScreen from '@/screens/JoinCircleScreen';
import CircleHomeScreen from '@/screens/CircleHomeScreen';
import CircleSermonDiscussionsScreen from '@/screens/CircleSermonDiscussionsScreen';
import CircleSermonDiscussionDetailScreen from '@/screens/CircleSermonDiscussionDetailScreen';
import FamilySermonDiscussionsScreen from '@/screens/FamilySermonDiscussionsScreen';
import FamilySermonDiscussionDetailScreen from '@/screens/FamilySermonDiscussionDetailScreen';
import CreateCircleScreen from '@/screens/CreateCircleScreen';
import PrayerTogetherScreen from '@/screens/PrayerTogetherScreen';
import ScriptureTogetherScreen from '@/screens/ScriptureTogetherScreen';
import CheckInScreen from '@/screens/CheckInScreen';
import EncouragementScreen from '@/screens/EncouragementScreen';
import AccountabilityScreen from '@/screens/AccountabilityScreen';
import MyChurchScreen from '@/screens/MyChurchScreen';
import SundayModeScreen from '@/screens/SundayModeScreen';
import SermonNotesScreen from '@/screens/SermonNotesScreen';
import SermonAssistantScreen from '@/screens/SermonAssistantScreen';
import SermonRecordingScreen from '@/screens/SermonRecordingScreen';
import SermonRecordingDetailScreen from '@/screens/SermonRecordingDetailScreen';
import SermonFollowUpScreen from '@/screens/SermonFollowUpScreen';
import ContinueSundayScreen from '@/screens/ContinueSundayScreen';
import SermonCompanionScreen from '@/screens/SermonCompanionScreen';
import AskMyPastorScreen from '@/screens/AskMyPastorScreen';
import ChurchStudiesScreen from '@/screens/ChurchStudiesScreen';
import ManageChurchStudiesScreen from '@/screens/ManageChurchStudiesScreen';
import SmallGroupModeScreen from '@/screens/SmallGroupModeScreen';
import ChurchPrayerScreen from '@/screens/ChurchPrayerScreen';
import type { Circle, CircleSermonDiscussion, Sermon } from '@/lib/togetherTypes';
import type { FamilySermonDiscussion } from '@/lib/familyTypes';

// Phase 9 imports
import LegacyHomeScreen from '@/screens/LegacyHomeScreen';
import MyJourneyScreen from '@/screens/MyJourneyScreen';
import LifeSeasonsScreen from '@/screens/LifeSeasonsScreen';
import GodsFaithfulnessScreen from '@/screens/GodsFaithfulnessScreen';
import PrayerHistoryScreen from '@/screens/PrayerHistoryScreen';
import ScriptureThatCarriedMeScreen from '@/screens/ScriptureThatCarriedMeScreen';
import TestimonyScreen from '@/screens/TestimonyScreen';
import FamilyLegacyScreen from '@/screens/FamilyLegacyScreen';
import LettersScreen from '@/screens/LettersScreen';
import MilestonesScreen from '@/screens/MilestonesScreen';
import LegacyVaultScreen from '@/screens/LegacyVaultScreen';
import YearInReviewScreen from '@/screens/YearInReviewScreen';
import LegacySearchScreen from '@/screens/LegacySearchScreen';
import BuildLegacyScreen from '@/screens/BuildLegacyScreen';

// Phase 10 imports
import PrivacyCenterScreen from '@/screens/PrivacyCenterScreen';
import BetaFeedbackScreen from '@/screens/BetaFeedbackScreen';

// Phase 11 imports

type AppState = 'splash' | 'onboarding' | 'app';

export type Overlay =
  | { type: 'none' }
  | { type: 'bible-mode'; walk: Walk; mode: 'physical' | 'in-app' }
  | { type: 'bible-reader'; walk: Walk }
  | { type: 'bible-reference'; book: string; chapter: number; verseStart: number | null; verseEnd: number | null; returnTo?: 'church_studies'; returnOverlay?: Overlay }
  | { type: 'profile_hub' }
  | { type: 'family' }
  | { type: 'reach' }
  | { type: 'library_search' }
  | { type: 'admin_sources' }
  | { type: 'retrieval_debug' }
  | { type: 'rag_tests' }
  | { type: 'phase6_tests' }
  | { type: 'qa_dashboard' }
  | { type: 'source_batches' }
  | { type: 'release_gate' }
  | { type: 'production_status' }
  // Phase 8 overlays
  | { type: 'together' }
  | { type: 'together_join_code' }
  | { type: 'circle_home'; circle: Circle }
  | { type: 'circle_sermon_discussions'; circle: Circle }
  | { type: 'circle_sermon_discussion'; circle: Circle; discussion: CircleSermonDiscussion }
  | { type: 'family_sermon_discussions' }
  | { type: 'family_sermon_discussion'; discussion: FamilySermonDiscussion }
  | { type: 'create_circle' }
  | { type: 'prayer_together'; circle?: Circle }
  | { type: 'scripture_together'; circle?: Circle }
  | { type: 'check_in'; circle?: Circle }
  | { type: 'encouragement'; circle?: Circle }
  | { type: 'accountability'; circle?: Circle }
  | { type: 'my_church' }
  | { type: 'sunday_mode' }
  | { type: 'sermon_notes' }
  | { type: 'sermon_assistant' }
  | { type: 'sermon_recording' }
  | { type: 'sermon_recording_detail'; recordingId: string; fresh: boolean; interrupted: boolean; initialView?: 'details' | 'insights' }
  | { type: 'sermon_follow_up'; sermon: Sermon }
  | { type: 'continue_sunday' }
  | { type: 'sermon_companion'; sermon: Sermon }
  | { type: 'ask_my_pastor'; sermon: Sermon }
  | { type: 'church_studies' }
  | { type: 'manage_church_studies' }
  | { type: 'small_groups' }
  | { type: 'church_prayer' }
  | { type: 'phase8_tests' }
  // Phase 9 overlays
  | { type: 'legacy_home' }
  | { type: 'legacy_journey' }
  | { type: 'legacy_seasons' }
  | { type: 'legacy_faithfulness' }
  | { type: 'legacy_prayer_history' }
  | { type: 'legacy_scripture' }
  | { type: 'legacy_testimony' }
  | { type: 'legacy_family' }
  | { type: 'legacy_letters' }
  | { type: 'legacy_milestones' }
  | { type: 'legacy_vault' }
  | { type: 'legacy_year_review' }
  | { type: 'legacy_search' }
  | { type: 'legacy_build' }
  | { type: 'phase9_tests' }
  // Phase 10 overlays
  | { type: 'privacy_center' }
  | { type: 'system_health' }
  | { type: 'ai_usage' }
  | { type: 'beta_feedback' }
  | { type: 'feature_flags' }
  | { type: 'legal_placeholders' }
  | { type: 'production_readiness' }
  | { type: 'phase10_tests' }
  // Phase 11 overlays
  | { type: 'phase11_tests' }
  | { type: 'mobile_build_guide' };

export default function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({ type: 'none' });

  useEffect(() => {
    const openRecorder = () => setOverlay({ type: 'sermon_recording' });
    window.addEventListener(OPEN_SERMON_RECORDER_EVENT, openRecorder);
    return () => window.removeEventListener(OPEN_SERMON_RECORDER_EVENT, openRecorder);
  }, []);
  const [session, setSession] = useState<{ user: { id: string; email?: string } | null } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [askContext, setAskContext] = useState<string | AskHandoffContext | ChildAskedHandoff | SermonAskHandoff | null>(null);
  const [sermonAskRecordingId, setSermonAskRecordingId] = useState<string | null>(null);
  const [activeAskConversationId, setActiveAskConversationId] = useState<string | null>(null);
  const [askKeyboardOpen, setAskKeyboardOpen] = useState(false);
  const [activeChurchId, setActiveChurchId] = useState<string | null>(null);
  const [globalTranslation, setGlobalTranslation] = useState<BibleTranslation>(getInitialTranslation);

  function handleTranslationChange(tr: BibleTranslation) {
    setGlobalTranslation(tr);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('solapath_translation', tr);
    }
  }
  const authGenerationRef = useRef(0);

  const loadProfile = useCallback(async () => {
    if (profileLoading) return;
    if (!session?.user?.id) return;
    const gen = authGenerationRef.current;
    setProfileLoading(true);
    const userId = session.user.id;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (gen !== authGenerationRef.current) return;

    if (error) {
      console.error('[App] loadProfile error', error);
      setProfileLoading(false);
      return;
    }

    if (data) {
      setProfile(data as Profile);
      if (!(data as Profile).onboarding_completed) {
        setAppState('onboarding');
      }
    } else {
      setAppState('onboarding');
    }
    setProfileLoading(false);
  }, [profileLoading, session]);

  useEffect(() => {
    if (appState !== 'app' || profile || profileLoading || !session) return;
    loadProfile();
  }, [appState, profile, profileLoading, session, loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s as typeof session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT' || !s) {
        authGenerationRef.current++;
        setSession(null);
        setProfile(null);
        setProfileLoading(false);
        setAuthLoading(false);
        setOverlay({ type: 'none' });
        setActiveTab('today');
        return;
      }
      setSession(s as typeof session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    authGenerationRef.current++;
    setProfileLoading(false);
    setAuthLoading(false);
    setSession(null);
    setProfile(null);
    setOverlay({ type: 'none' });
    setActiveTab('today');
    await supabase.auth.signOut();
  }

  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  async function handleOnboardingComplete(data: OnboardingData) {
    if (onboardingSaving) return;
    setOnboardingSaving(true);
    setOnboardingError(null);

    const userId = session?.user?.id;
    if (!userId) {
      setOnboardingSaving(false);
      setOnboardingError('Could not identify your account. Please sign in again.');
      return;
    }

    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        display_name: data.display_name || null,
        life_stage: data.life_stage || null,
        season: data.season || null,
        preferred_translation: data.preferred_translation,
        theological_depth: data.theological_depth,
        available_time_minutes: data.available_time_minutes,
        bible_familiarity: data.bible_familiarity || null,
        memory_enabled: data.memory_enabled,
        onboarding_completed: true,
      })
      .select('*')
      .single();

    if (insertError || !created) {
      console.error('[App] handleOnboardingComplete insert failed', insertError);
      setOnboardingSaving(false);
      setOnboardingError('Could not save your profile. Please check your connection and try again.');
      return;
    }

    if (data.memory_enabled) {
      const memories = [
        { category: 'life_stage', content: data.life_stage, source: 'onboarding' as const, user_id: userId },
        { category: 'preference', content: `Current season: ${data.season}`, source: 'onboarding' as const, user_id: userId },
        { category: 'preference', content: `Preferred translation: ${data.preferred_translation}`, source: 'onboarding' as const, user_id: userId },
        { category: 'preference', content: `Bible familiarity: ${data.bible_familiarity}`, source: 'onboarding' as const, user_id: userId },
        { category: 'preference', content: `Available devotional time: ${data.available_time_minutes} minutes`, source: 'onboarding' as const, user_id: userId },
      ].filter((m) => m.content);

      if (memories.length > 0) {
        const { error: memError } = await supabase.from('memories').insert(memories);
        if (memError) {
          console.error('[App] memory insert failed', memError);
        }
      }
    }

    setProfile(created as Profile);
    setAppState('app');
    setOnboardingSaving(false);
  }

  function handleStartWalk(walk: Walk) {
    setOverlay({ type: 'bible-mode', walk, mode: 'physical' });
  }

  function handleReadInApp(walk: Walk) {
    setOverlay({ type: 'bible-reader', walk });
  }

  function handleOpenChurchStudyPassage(passageReference: string): boolean {
    const parsed = parsePassageReference(passageReference);
    if (!parsed) return false;
    setOverlay({ type: 'bible-reference', book: parsed.book, chapter: parsed.chapter, verseStart: parsed.verseStart, verseEnd: parsed.verseEnd, returnTo: 'church_studies' });
    return true;
  }

  function handleOpenBibleReference(book: string, chapter: number, verseStart: number | null, verseEnd: number | null) {
    setOverlay({
      type: 'bible-reference', book, chapter, verseStart, verseEnd,
      returnOverlay: overlay.type === 'sermon_recording_detail' ? overlay : undefined,
    });
  }

  function handleOpenDiscussionScripture(reference: string, detail: Overlay): boolean {
    const parsed = parsePassageReference(reference);
    if (!parsed) return false;
    setOverlay({ type: 'bible-reference', book: parsed.book, chapter: parsed.chapter, verseStart: parsed.verseStart, verseEnd: parsed.verseEnd, returnOverlay: detail });
    return true;
  }

  function handleExitBibleMode() {
    setOverlay({ type: 'none' });
  }

  function handleReflectionComplete() {
    setOverlay({ type: 'none' });
    setActiveTab('today');
  }

  function handleHelpMeUnderstand(walk: Walk) {
    setOverlay({ type: 'none' });
    setActiveTab('ask');
    setAskContext(walk.passage_reference);
  }

  function handleProfileUpdate() {
    loadProfile();
  }

  if (appState === 'splash') {
    return <SplashScreen onComplete={() => setAppState('app')} />;
  }

  if (authLoading || (appState === 'app' && profileLoading && !profile)) {
    return (
      <ErrorBoundary>
        <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-6 animate-pulse">
            <BrandMark size={64} />
          </div>
          <h1 className="font-serif text-3xl text-ivory-50 tracking-tight mb-2">SOLAPATH</h1>
          <p className="text-ivory-500 text-sm">Loading...</p>
        </div>
      </ErrorBoundary>
    );
  }

  if (!session) {
    return <WelcomeScreen onAuthed={loadProfile} />;
  }

  if (appState === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} saving={onboardingSaving} error={onboardingError} />;
  }

  if (overlay.type === 'bible-mode') {
    return (
      <ErrorBoundary>
        <BibleModeScreen
          walk={overlay.walk}
          mode={overlay.mode}
          theologicalDepth={profile?.theological_depth || 'simple'}
          onExit={handleExitBibleMode}
          onReflectionComplete={handleReflectionComplete}
          onHelpMeUnderstand={handleHelpMeUnderstand}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'bible-reader') {
    const parsed = parsePassageReference(overlay.walk.passage_reference);
    return (
      <ErrorBoundary>
        <BibleScreen
          onStartWalk={handleStartWalk}
          translation={globalTranslation}
          onTranslationChange={handleTranslationChange}
          onAskScripture={(b, c, vs, ve) => {
            const ref = vs === ve ? `${b} ${c}:${vs}` : `${b} ${c}:${vs}\u2013${ve}`;
            setOverlay({ type: 'none' });
            setActiveTab('ask');
            setAskContext(ref);
          }}
          initialReference={parsed}
          onBack={() => setOverlay({ type: 'none' })}
        />
      </ErrorBoundary>
    );
  }

  const studyDetail = overlay.type === 'sermon_recording_detail'
    ? overlay
    : overlay.type === 'bible-reference' && overlay.returnOverlay?.type === 'sermon_recording_detail'
      ? overlay.returnOverlay
      : null;

  if (overlay.type === 'bible-reference' || studyDetail) {
    const bibleLayer = overlay.type === 'bible-reference' ? (
      <BibleScreen
        onStartWalk={handleStartWalk}
        translation={globalTranslation}
        onTranslationChange={handleTranslationChange}
        onAskScripture={(b, c, vs, ve) => {
          const ref = vs === ve ? `${b} ${c}:${vs}` : `${b} ${c}:${vs}\u2013${ve}`;
          setOverlay({ type: 'none' });
          setActiveTab('ask');
          setAskContext(ref);
        }}
        initialReference={{ book: overlay.book, chapter: overlay.chapter, verseStart: overlay.verseStart, verseEnd: overlay.verseEnd }}
        onBack={() => setOverlay(overlay.returnOverlay ?? (overlay.returnTo === 'church_studies' ? { type: 'church_studies' } : { type: 'none' }))}
      />
    ) : null;

    if (!studyDetail) return <ErrorBoundary>{bibleLayer}</ErrorBoundary>;

    return (
      <ErrorBoundary>
        <div>
          <div hidden={overlay.type !== 'sermon_recording_detail'}>
            <SermonRecordingDetailScreen
              recordingId={studyDetail.recordingId}
              fresh={studyDetail.fresh}
              interrupted={studyDetail.interrupted}
              initialView={studyDetail.initialView}
              onDone={() => setOverlay({ type: 'sermon_assistant' })}
              onOpenBible={handleOpenBibleReference}
              profile={profile}
              onViewSharedDiscussion={(circle, discussion) => setOverlay({ type: 'circle_sermon_discussion', circle, discussion })}
              onOpenFamilyDiscussion={(discussion) => setOverlay({ type: 'family_sermon_discussion', discussion })}
              onContinueInAsk={(handoff) => {
                setSermonAskRecordingId(studyDetail.recordingId);
                setActiveAskConversationId(null);
                localStorage.removeItem('solapath_active_ask_conv');
                localStorage.removeItem('solapath_ask_return_conv');
                setOverlay({ type: 'none' });
                setActiveTab('ask');
                setAskContext(handoff);
              }}
            />
          </div>
          {bibleLayer}
        </div>
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'profile_hub' && profile) {
    return (
      <ErrorBoundary>
        <ProfileHubScreen
          profile={profile}
          onBack={() => setOverlay({ type: 'none' })}
          onProfileUpdate={handleProfileUpdate}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'family') {
    return (
      <ErrorBoundary>
        <>
          <FamilyScreen
            onClose={() => setOverlay({ type: 'none' })}
            onOpenSermonDiscussions={() => setOverlay({ type: 'family_sermon_discussions' })}
            onAskHandoff={(handoff) => {
              setActiveAskConversationId(null);
              localStorage.removeItem('solapath_active_ask_conv');
              localStorage.removeItem('solapath_ask_return_conv');
              setOverlay({ type: 'none' });
              setActiveTab('ask');
              setAskContext(handoff);
            }}
          />
          <BottomNav
            active={activeTab}
            onChange={(tab) => {
              setOverlay({ type: 'none' });
              setActiveTab(tab);
            }}
          />
        </>
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'reach') {
    return (
      <ErrorBoundary>
        <ReachScreen onBack={() => setOverlay({ type: 'none' })} />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'library_search') {
    return <ErrorBoundary><LibrarySearchScreen onBack={() => setOverlay({ type: 'none' })} /></ErrorBoundary>;
  }
  if (import.meta.env.DEV && DevOverlayRenderer && isDevOverlayType(overlay.type)) {
    return (
      <Suspense fallback={null}>
        <DevOverlayRenderer overlay={overlay} profile={profile} onNavigate={setOverlay} />
      </Suspense>
    );
  }

  // Phase 8 overlays
  if (overlay.type === 'together' && profile) {
    return (
      <ErrorBoundary>
        <TogetherScreen
          profile={profile}
          onBack={() => setOverlay({ type: 'none' })}
          onOpenCircle={(circle) => setOverlay({ type: 'circle_home', circle })}
          onOpenCreateCircle={() => setOverlay({ type: 'create_circle' })}
          onOpenJoinCircle={() => setOverlay({ type: 'together_join_code' })}
          onOpenPrayer={(circle) => setOverlay({ type: 'prayer_together', circle })}
          onOpenScripture={(circle) => setOverlay({ type: 'scripture_together', circle })}
          onOpenCheckIn={(circle) => setOverlay({ type: 'check_in', circle })}
          onOpenEncouragement={() => setOverlay({ type: 'encouragement' })}
          onOpenAccountability={() => setOverlay({ type: 'accountability' })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'together_join_code' && profile) {
    return (
      <ErrorBoundary>
        <JoinCircleScreen
          onBack={() => setOverlay({ type: 'together' })}
          onJoined={() => setOverlay({ type: 'together' })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'circle_sermon_discussions' && profile) {
    return (
      <ErrorBoundary>
        <CircleSermonDiscussionsScreen
          profile={profile}
          circle={overlay.circle}
          onBack={() => setOverlay({ type: 'circle_home', circle: overlay.circle })}
          onOpenDiscussion={(discussion) => setOverlay({ type: 'circle_sermon_discussion', circle: overlay.circle, discussion })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'family_sermon_discussions') {
    return (
      <ErrorBoundary>
        <FamilySermonDiscussionsScreen
          onBack={() => setOverlay({ type: 'family' })}
          onOpenDiscussion={(discussion) => setOverlay({ type: 'family_sermon_discussion', discussion })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'family_sermon_discussion') {
    return (
      <ErrorBoundary>
        <FamilySermonDiscussionDetailScreen
          discussion={overlay.discussion}
          onBack={() => setOverlay({ type: 'family_sermon_discussions' })}
          onDeleted={() => setOverlay({ type: 'family_sermon_discussions' })}
          onOpenScripture={(reference) => handleOpenDiscussionScripture(reference, overlay)}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'circle_sermon_discussion' && profile) {
    return (
      <ErrorBoundary>
        <CircleSermonDiscussionDetailScreen
          profile={profile}
          circle={overlay.circle}
          discussion={overlay.discussion}
          onBack={() => setOverlay({ type: 'circle_sermon_discussions', circle: overlay.circle })}
          onDeleted={() => setOverlay({ type: 'circle_sermon_discussions', circle: overlay.circle })}
          onOpenScripture={(reference) => handleOpenDiscussionScripture(reference, overlay)}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'circle_home' && profile) {
    return (
      <ErrorBoundary>
        <CircleHomeScreen
          profile={profile}
          circle={overlay.circle}
          onBack={() => setOverlay({ type: 'together' })}
          onOpenPrayer={(circle) => setOverlay({ type: 'prayer_together', circle })}
          onOpenScripture={(circle) => setOverlay({ type: 'scripture_together', circle })}
          onOpenCheckIn={(circle) => setOverlay({ type: 'check_in', circle })}
          onOpenEncouragement={(circle) => setOverlay({ type: 'encouragement', circle })}
          onOpenAccountability={(circle) => setOverlay({ type: 'accountability', circle })}
          onOpenSermonDiscussions={(circle) => setOverlay({ type: 'circle_sermon_discussions', circle })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'create_circle' && profile) {
    return (
      <ErrorBoundary>
        <CreateCircleScreen
          onBack={() => setOverlay({ type: 'together' })}
          onCreated={() => setOverlay({ type: 'together' })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'prayer_together' && profile) {
    return <ErrorBoundary><PrayerTogetherScreen profile={profile} circle={overlay.circle} onBack={() => setOverlay(overlay.circle ? { type: 'circle_home', circle: overlay.circle } : { type: 'together' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'scripture_together' && profile) {
    return <ErrorBoundary><ScriptureTogetherScreen profile={profile} circle={overlay.circle} onBack={() => setOverlay(overlay.circle ? { type: 'circle_home', circle: overlay.circle } : { type: 'together' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'check_in' && profile) {
    return <ErrorBoundary><CheckInScreen profile={profile} circle={overlay.circle} onBack={() => setOverlay(overlay.circle ? { type: 'circle_home', circle: overlay.circle } : { type: 'together' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'encouragement' && profile) {
    return <ErrorBoundary><EncouragementScreen profile={profile} circle={overlay.circle} onBack={() => setOverlay(overlay.circle ? { type: 'circle_home', circle: overlay.circle } : { type: 'together' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'accountability' && profile) {
    return <ErrorBoundary><AccountabilityScreen profile={profile} onBack={() => setOverlay({ type: 'none' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'my_church' && profile) {
    return (
      <ErrorBoundary>
        <MyChurchScreen
          profile={profile}
          activeChurchId={activeChurchId}
          onActiveChurchChange={setActiveChurchId}
          onBack={() => setOverlay({ type: 'none' })}
          onOpenSundayMode={() => setOverlay({ type: 'sunday_mode' })}
          onOpenSermonNotes={() => setOverlay({ type: 'sermon_notes' })}
          onOpenSermonAssistant={() => setOverlay({ type: 'sermon_assistant' })}
          onOpenChurchStudies={() => setOverlay({ type: 'church_studies' })}
          onOpenManageChurchStudies={() => setOverlay({ type: 'manage_church_studies' })}
          onOpenChurchPrayer={() => setOverlay({ type: 'church_prayer' })}
          onOpenSmallGroups={() => setOverlay({ type: 'small_groups' })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'sunday_mode' && profile) {
    return <ErrorBoundary><SundayModeScreen profile={profile} onBack={() => setOverlay({ type: 'my_church' })} onOpenSermonNotes={() => setOverlay({ type: 'sermon_notes' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'sermon_notes' && profile) {
    return (
      <ErrorBoundary>
        <SermonNotesScreen
          profile={profile}
          onBack={() => setOverlay({ type: 'my_church' })}
          onOpenSermonFollowUp={(sermon) => setOverlay({ type: 'sermon_follow_up', sermon })}
          onOpenContinueSunday={() => setOverlay({ type: 'continue_sunday' })}
          onOpenSermonCompanion={(sermon) => setOverlay({ type: 'sermon_companion', sermon })}
          onOpenAskMyPastor={(sermon) => setOverlay({ type: 'ask_my_pastor', sermon })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'sermon_assistant' && profile) {
    return (
      <ErrorBoundary>
        <SermonAssistantScreen
          profile={profile}
          onBack={() => setOverlay({ type: 'my_church' })}
          onRecord={() => setOverlay({ type: 'sermon_recording' })}
          onOpenRecording={(recordingId) => setOverlay({ type: 'sermon_recording_detail', recordingId, fresh: false, interrupted: false })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'sermon_recording' && profile) {
    return (
      <ErrorBoundary>
        <SermonRecordingScreen
          profileId={profile.id}
          onExit={() => setOverlay({ type: 'sermon_assistant' })}
          onTakeNotes={() => setOverlay({ type: 'sermon_notes' })}
          onCaptured={(recordingId, interrupted) => setOverlay({ type: 'sermon_recording_detail', recordingId, fresh: true, interrupted })}
        />
      </ErrorBoundary>
    );
  }

  if (overlay.type === 'sermon_follow_up') {
    return <ErrorBoundary><SermonFollowUpScreen sermon={overlay.sermon} onBack={() => setOverlay({ type: 'sermon_notes' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'continue_sunday' && profile) {
    return <ErrorBoundary><ContinueSundayScreen profile={profile} onBack={() => setOverlay({ type: 'my_church' })} onStartWalk={() => setOverlay({ type: 'none' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'sermon_companion') {
    return <ErrorBoundary><SermonCompanionScreen sermon={overlay.sermon} onBack={() => setOverlay({ type: 'sermon_notes' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'ask_my_pastor') {
    return <ErrorBoundary><AskMyPastorScreen sermon={overlay.sermon} onBack={() => setOverlay({ type: 'sermon_notes' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'church_studies' && profile) {
    return <ErrorBoundary><ChurchStudiesScreen profile={profile} churchId={activeChurchId} onBack={() => setOverlay({ type: 'my_church' })} onOpenBible={handleOpenChurchStudyPassage} /></ErrorBoundary>;
  }
  if (overlay.type === 'manage_church_studies' && profile) {
    return <ErrorBoundary><ManageChurchStudiesScreen profile={profile} churchId={activeChurchId} onBack={() => setOverlay({ type: 'my_church' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'small_groups' && profile) {
    return <ErrorBoundary><SmallGroupModeScreen profile={profile} activeChurchId={activeChurchId} onBack={() => setOverlay({ type: 'my_church' })} /></ErrorBoundary>;
  }

  if (overlay.type === 'church_prayer' && profile) {
    return <ErrorBoundary><ChurchPrayerScreen profile={profile} activeChurchId={activeChurchId} onBack={() => setOverlay({ type: 'my_church' })} /></ErrorBoundary>;
  }

  // Phase 9 overlays
  if (overlay.type === 'legacy_home' && profile) {
    return (
      <ErrorBoundary>
        <LegacyHomeScreen profile={profile} onBack={() => setOverlay({ type: 'none' })}
          onOpenJourney={() => setOverlay({ type: 'legacy_journey' })}
          onOpenSeasons={() => setOverlay({ type: 'legacy_seasons' })}
          onOpenFaithfulness={() => setOverlay({ type: 'legacy_faithfulness' })}
          onOpenPrayerHistory={() => setOverlay({ type: 'legacy_prayer_history' })}
          onOpenScripture={() => setOverlay({ type: 'legacy_scripture' })}
          onOpenTestimony={() => setOverlay({ type: 'legacy_testimony' })}
          onOpenFamilyLegacy={() => setOverlay({ type: 'legacy_family' })}
          onOpenLetters={() => setOverlay({ type: 'legacy_letters' })}
          onOpenMilestones={() => setOverlay({ type: 'legacy_milestones' })}
          onOpenVault={() => setOverlay({ type: 'legacy_vault' })}
          onOpenYearReview={() => setOverlay({ type: 'legacy_year_review' })}
          onOpenSearch={() => setOverlay({ type: 'legacy_search' })}
          onOpenBuildLegacy={() => setOverlay({ type: 'legacy_build' })}
        />
      </ErrorBoundary>
    );
  }
  if (overlay.type === 'legacy_journey' && profile) {
    return <ErrorBoundary><MyJourneyScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} onOpenBuildLegacy={() => setOverlay({ type: 'legacy_build' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_seasons' && profile) {
    return <ErrorBoundary><LifeSeasonsScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_faithfulness' && profile) {
    return <ErrorBoundary><GodsFaithfulnessScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_prayer_history' && profile) {
    return <ErrorBoundary><PrayerHistoryScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_scripture' && profile) {
    return <ErrorBoundary><ScriptureThatCarriedMeScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_testimony' && profile) {
    return <ErrorBoundary><TestimonyScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_family' && profile) {
    return <ErrorBoundary><FamilyLegacyScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_letters' && profile) {
    return <ErrorBoundary><LettersScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_milestones' && profile) {
    return <ErrorBoundary><MilestonesScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_vault' && profile) {
    return <ErrorBoundary><LegacyVaultScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_year_review' && profile) {
    return <ErrorBoundary><YearInReviewScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_search' && profile) {
    return <ErrorBoundary><LegacySearchScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }
  if (overlay.type === 'legacy_build' && profile) {
    return <ErrorBoundary><BuildLegacyScreen profile={profile} onBack={() => setOverlay({ type: 'legacy_home' })} /></ErrorBoundary>;
  }

  // Phase 10 overlays
  if (overlay.type === 'privacy_center' && profile) {
    return <ErrorBoundary><PrivacyCenterScreen profile={profile} onBack={() => setOverlay({ type: 'none' })} onProfileUpdate={handleProfileUpdate} /></ErrorBoundary>;
  }
  if (overlay.type === 'beta_feedback' && profile) {
    return <ErrorBoundary><BetaFeedbackScreen profile={profile} onBack={() => setOverlay({ type: 'none' })} /></ErrorBoundary>;
  }

  return (
    <ErrorBoundary>
    <>
      {activeTab === 'today' && (
        <TodayScreen
          profile={profile}
          onOpenProfile={() => setOverlay({ type: 'profile_hub' })}
          onProfileUpdate={handleProfileUpdate}
          onStartWalk={handleStartWalk}
          onReadInApp={handleReadInApp}
          onContinueInAsk={(handoff) => {
            setActiveTab('ask');
            setAskContext(handoff);
          }}
        />
      )}
      {activeTab === 'bible' && <BibleScreen onStartWalk={handleStartWalk} translation={globalTranslation} onTranslationChange={handleTranslationChange} onAskScripture={(b, c, vs, ve) => {
        const ref = vs === ve ? `${b} ${c}:${vs}` : `${b} ${c}:${vs}\u2013${ve}`;
        setActiveTab('ask');
        setAskContext(ref);
      }} />}
      {activeTab === 'ask' && <AskScreen theologicalDepth={profile?.theological_depth || 'simple'} profile={profile} onProfileUpdate={handleProfileUpdate} onOpenBibleReference={handleOpenBibleReference} initialContext={askContext} onContextConsumed={() => setAskContext(null)} onKeyboardVisibilityChange={setAskKeyboardOpen} activeConversationId={activeAskConversationId} onConversationChange={setActiveAskConversationId} translation={globalTranslation} onTranslationChange={handleTranslationChange} onBackToFamily={() => setOverlay({ type: 'family' })} onBackToSermon={sermonAskRecordingId ? () => setOverlay({ type: 'sermon_recording_detail', recordingId: sermonAskRecordingId, fresh: false, interrupted: false, initialView: 'insights' }) : undefined} />}

      {activeTab === 'prayer' && <PrayerScreen profile={profile} />}
      {activeTab === 'explore' && <YouScreen profile={profile} onProfileUpdate={handleProfileUpdate} session={session} onSignOut={handleSignOut} onOpenFamily={() => setOverlay({ type: 'family' })} onOpenReach={() => setOverlay({ type: 'reach' })} onOpenLibrarySearch={() => setOverlay({ type: 'library_search' })} onOpenTogether={() => setOverlay({ type: 'together' })} onOpenMyChurch={() => setOverlay({ type: 'my_church' })} onOpenLegacy={() => setOverlay({ type: 'legacy_home' })} onOpenPrivacyCenter={() => setOverlay({ type: 'privacy_center' })} onOpenBetaFeedback={() => setOverlay({ type: 'beta_feedback' })} {...(import.meta.env.DEV ? { onOpenAdminSources: () => setOverlay({ type: 'admin_sources' }), onOpenRetrievalDebug: () => setOverlay({ type: 'retrieval_debug' }), onOpenRAGTests: () => setOverlay({ type: 'rag_tests' }), onOpenPhase6Tests: () => setOverlay({ type: 'phase6_tests' }), onOpenQADashboard: () => setOverlay({ type: 'qa_dashboard' }), onOpenSourceBatches: () => setOverlay({ type: 'source_batches' }), onOpenReleaseGate: () => setOverlay({ type: 'release_gate' }), onOpenProductionStatus: () => setOverlay({ type: 'production_status' }), onOpenPhase8Tests: () => setOverlay({ type: 'phase8_tests' }), onOpenPhase9Tests: () => setOverlay({ type: 'phase9_tests' }), onOpenProductionReadiness: () => setOverlay({ type: 'production_readiness' }), onOpenPhase10Tests: () => setOverlay({ type: 'phase10_tests' }) } : {})} />}

      {!(activeTab === 'ask' && askKeyboardOpen) && <BottomNav active={activeTab} onChange={setActiveTab} />}
    </>
    </ErrorBoundary>
  );
}
