import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { getMyCircles, createCircleSermonDiscussion } from '@/lib/togetherEngine';
import {
  buildDiscussionDraft, buildDiscussionStarter, validateDiscussionBody,
  type DiscussionSelection,
} from '@/lib/sermonDiscussion';
import type { Profile } from '@/lib/types';
import type { Circle, CircleSermonDiscussion } from '@/lib/togetherTypes';
import type { SermonInsightsRecord } from '@/lib/sermonRecordingStore';
import CircleChoiceStep from '@/components/sermon/discussion/CircleChoiceStep';
import DiscussionSourceStep from '@/components/sermon/discussion/DiscussionSourceStep';
import DiscussionEditStep from '@/components/sermon/discussion/DiscussionEditStep';
import DiscussionPreviewStep from '@/components/sermon/discussion/DiscussionPreviewStep';

type SermonInsightsContent = NonNullable<SermonInsightsRecord['insights']>;
type Step = 'circle' | 'sources' | 'edit' | 'preview' | 'done';

const STEP_TITLES: Record<Step, string> = {
  circle: 'Choose a Circle',
  sources: 'Choose what to include',
  edit: 'Write your starter',
  preview: 'Preview',
  done: 'Shared',
};

interface Props {
  profile: Profile;
  sermonTitle: string | null;
  insights: SermonInsightsContent;
  onClose: () => void;
  onViewDiscussion: (circle: Circle, discussion: CircleSermonDiscussion) => void;
}

export default function ShareSermonDiscussionFlow({ profile, sermonTitle, insights, onClose, onViewDiscussion }: Props) {
  const [step, setStep] = useState<Step>('circle');
  const [circles, setCircles] = useState<Circle[] | null>(null);
  const [circlesError, setCirclesError] = useState(false);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [selection, setSelection] = useState<DiscussionSelection>({
    includeTitle: false, mainPoint: null, scriptures: [], question: null,
  });
  const [body, setBody] = useState('');
  const [lastStarter, setLastStarter] = useState('');
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [created, setCreated] = useState<CircleSermonDiscussion | null>(null);
  const sharingRef = useRef(false);

  const hasTitle = Boolean(sermonTitle?.trim());

  const loadCircles = useCallback(async () => {
    setCirclesError(false);
    try {
      const mine = await getMyCircles(profile);
      setCircles(mine);
      if (mine.length === 1) setCircle(mine[0]);
    } catch {
      setCirclesError(true);
    }
  }, [profile]);

  useEffect(() => {
    void loadCircles();
  }, [loadCircles]);

  function goToSources() {
    if (!circle) return;
    setStep('sources');
  }

  function goToEdit() {
    const starter = buildDiscussionStarter(selection);
    if (body.trim() === '' || body === lastStarter) setBody(starter);
    setLastStarter(starter);
    setBodyError(null);
    setStep('edit');
  }

  function goToPreview() {
    const error = validateDiscussionBody(body);
    setBodyError(error);
    if (error) return;
    setShareError(null);
    setStep('preview');
  }

  async function handleShare() {
    if (sharingRef.current || !circle) return;
    const draft = buildDiscussionDraft(selection, sermonTitle, body);
    const error = validateDiscussionBody(draft.discussionBody);
    if (error) {
      setBodyError(error);
      setStep('edit');
      return;
    }
    sharingRef.current = true;
    setSharing(true);
    setShareError(null);
    try {
      const discussion = await createCircleSermonDiscussion(circle.id, draft);
      vibrate(12);
      setCreated(discussion);
      setStep('done');
    } catch (cause) {
      console.error('circle sermon discussion share failed', cause);
      setShareError("We couldn't share this discussion. Nothing was shared. Please try again.");
    } finally {
      sharingRef.current = false;
      setSharing(false);
    }
  }

  function handleBack() {
    if (step === 'circle') onClose();
    else if (step === 'sources') setStep('circle');
    else if (step === 'edit') setStep('sources');
    else if (step === 'preview') setStep('edit');
  }

  const scriptureOptions = Array.from(new Set(insights.scriptureReferences.map((r) => r.reference)));
  const mainPointOptions = insights.mainPoints.map((p) => p.title);
  const questionOptions = insights.reflectionQuestions;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950 animate-fade-in-up">
      <div className="app-container min-h-screen pb-28 flex flex-col mx-auto">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          {step === 'done' ? (
            <span className="w-8" />
          ) : (
            <button onClick={handleBack} className="btn-ghost" aria-label={step === 'circle' ? 'Close' : 'Back'}>
              {step === 'circle' ? <X size={20} /> : <ArrowLeft size={20} />}
            </button>
          )}
          <p className="ui-label">{STEP_TITLES[step]}</p>
          <span className="w-8" />
        </header>

        <div className="flex-1 px-6 mt-4">
          {step === 'circle' && (
            <>
              {!circles && !circlesError && <LoadingState message="Loading your Circles..." />}
              {circlesError && <ErrorState message="We couldn't load your Circles. Please try again." onRetry={loadCircles} />}
              {circles && (
                <CircleChoiceStep
                  circles={circles}
                  selectedId={circle?.id ?? null}
                  onSelect={setCircle}
                  onContinue={goToSources}
                />
              )}
            </>
          )}

          {step === 'sources' && (
            <DiscussionSourceStep
              hasTitle={hasTitle}
              sermonTitle={sermonTitle}
              mainPointOptions={mainPointOptions}
              scriptureOptions={scriptureOptions}
              questionOptions={questionOptions}
              selection={selection}
              onChange={setSelection}
              onContinue={goToEdit}
            />
          )}

          {step === 'edit' && (
            <DiscussionEditStep
              body={body}
              error={bodyError}
              onChange={(next) => { setBody(next); setBodyError(null); }}
              onContinue={goToPreview}
            />
          )}

          {(step === 'preview' || step === 'done') && circle && (
            <DiscussionPreviewStep
              circle={circle}
              sermonTitle={selection.includeTitle ? sermonTitle : null}
              body={body.trim()}
              scriptures={selection.scriptures}
              sharing={sharing}
              shareError={shareError}
              created={step === 'done' ? created : null}
              onBack={() => setStep('edit')}
              onShare={handleShare}
              onDone={onClose}
              onView={() => {
                if (created) onViewDiscussion(circle, created);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
