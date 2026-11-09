import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { LoadingState } from '@/components/States';
import {
  createMyFamilyProfile, createFamilySermonDiscussion, loadMyFamilyProfile,
} from '@/lib/familySermonDiscussions';
import {
  EMPTY_FAMILY_SELECTION, FAMILY_SCRIPTURE_MAX, buildFamilyDraft, buildFamilyStarter,
  resolveFamilyQuestion, validateFamilyBody, validateFamilyQuestion, type FamilySelection,
} from '@/lib/familySermonDiscussion';
import { DISCUSSION_BODY_MAX } from '@/lib/sermonDiscussion';
import type { FamilyProfile, FamilySermonDiscussion } from '@/lib/familyTypes';
import type { SermonInsightsRecord } from '@/lib/sermonRecordingStore';
import DiscussionEditStep from '@/components/sermon/discussion/DiscussionEditStep';
import FamilyDiscussionSourceStep from '@/components/sermon/family/FamilyDiscussionSourceStep';
import FamilyDiscussionPreviewStep from '@/components/sermon/family/FamilyDiscussionPreviewStep';

type SermonInsightsContent = NonNullable<SermonInsightsRecord['insights']>;
type Step = 'sources' | 'edit' | 'preview';

interface Props {
  sermonTitle: string | null;
  insights: SermonInsightsContent;
  onClose: () => void;
  onOpenDiscussion: (discussion: FamilySermonDiscussion) => void;
}

export default function PrepareFamilyDiscussionFlow({ sermonTitle, insights, onClose, onOpenDiscussion }: Props) {
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [familyState, setFamilyState] = useState<'loading' | 'error' | 'none' | 'ready'>('loading');
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const creatingRef = useRef(false);

  const [step, setStep] = useState<Step>('sources');
  const [selection, setSelection] = useState<FamilySelection>(EMPTY_FAMILY_SELECTION);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [lastStarter, setLastStarter] = useState('');
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<FamilySermonDiscussion | null>(null);
  const savingRef = useRef(false);

  const hasTitle = Boolean(sermonTitle?.trim());

  const loadFamily = useCallback(async () => {
    setFamilyState('loading');
    try {
      const profile = await loadMyFamilyProfile();
      setFamily(profile);
      setFamilyState(profile ? 'ready' : 'none');
    } catch (cause) {
      console.error('family profile load failed', cause);
      setFamilyState('error');
    }
  }, []);

  useEffect(() => {
    void loadFamily();
  }, [loadFamily]);

  async function handleCreateProfile() {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreatingProfile(true);
    setCreateError(null);
    try {
      const profile = await createMyFamilyProfile();
      vibrate(10);
      setFamily(profile);
      setFamilyState('ready');
    } catch (cause) {
      console.error('family profile create failed', cause);
      setCreateError("We couldn't create your Family Profile. Please try again.");
    } finally {
      creatingRef.current = false;
      setCreatingProfile(false);
    }
  }

  function goToEdit() {
    const questionError = validateFamilyQuestion(selection);
    setSourceError(questionError);
    if (questionError) return;
    const starter = buildFamilyStarter(selection.mainPoint, resolveFamilyQuestion(selection));
    if (body.trim() === '' || body === lastStarter) setBody(starter);
    setLastStarter(starter);
    setBodyError(null);
    setStep('edit');
  }

  function goToPreview() {
    const error = validateFamilyBody(body);
    setBodyError(error);
    if (error) return;
    setSaveError(null);
    setStep('preview');
  }

  async function handleSave() {
    if (savingRef.current || !family) return;
    const draft = buildFamilyDraft(selection, sermonTitle, body);
    const error = validateFamilyBody(draft.discussionBody);
    if (error) {
      setBodyError(error);
      setStep('edit');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const discussion = await createFamilySermonDiscussion(family.id, draft);
      vibrate(12);
      setSaved(discussion);
    } catch (cause) {
      console.error('family sermon discussion save failed', cause);
      setSaveError("We couldn't save this Family discussion. Your sermon recording and insights are safe. Nothing was added to Family.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function handleBack() {
    if (step === 'sources') onClose();
    else if (step === 'edit') setStep('sources');
    else setStep('edit');
  }

  const scriptureOptions = Array.from(new Set(insights.scriptureReferences.map((r) => r.reference)));
  const mainPointOptions = insights.mainPoints.map((p) => p.title);
  const questionOptions = insights.reflectionQuestions;
  const headerTitle = saved ? 'Saved' : step === 'sources' ? 'Prepare a Family Discussion' : step === 'edit' ? 'Write your starter' : 'Preview';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950 animate-fade-in-up">
      <div className="app-container min-h-screen pb-28 flex flex-col mx-auto">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          {saved || familyState !== 'ready' ? (
            <button onClick={onClose} className="btn-ghost" aria-label="Close">
              <X size={20} />
            </button>
          ) : (
            <button onClick={handleBack} className="btn-ghost" aria-label={step === 'sources' ? 'Close' : 'Back'}>
              {step === 'sources' ? <X size={20} /> : <ArrowLeft size={20} />}
            </button>
          )}
          <p className="ui-label">{headerTitle}</p>
          <span className="w-8" />
        </header>

        <div className="flex-1 px-6 mt-4">
          {familyState === 'loading' && <LoadingState message="Loading your Family Profile..." />}

          {familyState === 'error' && (
            <div className="premium-card p-5 animate-fade-in-up" role="alert">
              <p className="text-ivory-200 text-sm leading-relaxed mb-5">We couldn&apos;t load your Family Profile. Please try again.</p>
              <div className="flex flex-col gap-2">
                <button onClick={loadFamily} className="btn-primary w-full">Try Again</button>
                <button onClick={onClose} className="btn-secondary w-full">Cancel</button>
              </div>
            </div>
          )}

          {familyState === 'none' && (
            <div className="premium-card p-5 animate-fade-in-up">
              <p className="text-ivory-200 text-sm leading-relaxed mb-2">Create a Family Profile to save discussions for your household.</p>
              <p className="text-ivory-500 text-xs leading-relaxed mb-5">Your Family Profile stays private. You do not need to use your real family name.</p>
              {createError && <p className="text-ivory-300 text-xs leading-relaxed mb-4" role="alert">{createError}</p>}
              <div className="flex flex-col gap-2">
                <button onClick={handleCreateProfile} disabled={creatingProfile} className="btn-primary w-full disabled:opacity-40">
                  {creatingProfile ? 'Creating...' : 'Create Family Profile'}
                </button>
                <button onClick={onClose} disabled={creatingProfile} className="btn-secondary w-full disabled:opacity-40">Cancel</button>
              </div>
            </div>
          )}

          {familyState === 'ready' && step === 'sources' && (
            <FamilyDiscussionSourceStep
              hasTitle={hasTitle}
              sermonTitle={sermonTitle}
              mainPointOptions={mainPointOptions}
              scriptureOptions={scriptureOptions}
              questionOptions={questionOptions}
              selection={selection}
              error={sourceError}
              onChange={(next) => { setSelection(next); setSourceError(null); }}
              onContinue={goToEdit}
            />
          )}

          {familyState === 'ready' && step === 'edit' && (
            <DiscussionEditStep
              heading="You control what your family discusses."
              body={body}
              error={bodyError}
              onChange={(next) => { setBody(next.slice(0, DISCUSSION_BODY_MAX)); setBodyError(null); }}
              onContinue={goToPreview}
            />
          )}

          {familyState === 'ready' && step === 'preview' && (
            <FamilyDiscussionPreviewStep
              sermonTitle={selection.includeTitle ? sermonTitle : null}
              mainPoint={selection.mainPoint}
              scriptures={selection.scriptures.slice(0, FAMILY_SCRIPTURE_MAX)}
              question={resolveFamilyQuestion(selection)}
              body={body.trim()}
              saving={saving}
              saveError={saveError}
              saved={saved}
              onBack={() => setStep('edit')}
              onSave={handleSave}
              onDone={onClose}
              onOpen={() => {
                if (saved) onOpenDiscussion(saved);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
