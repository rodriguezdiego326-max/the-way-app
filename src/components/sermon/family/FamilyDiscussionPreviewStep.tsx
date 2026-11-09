import { AlertCircle, Check, Lock } from 'lucide-react';
import FamilyDiscussionContent from '@/components/family/FamilyDiscussionContent';
import type { FamilySermonDiscussion } from '@/lib/familyTypes';

interface Props {
  sermonTitle: string | null;
  mainPoint: string | null;
  scriptures: string[];
  question: string | null;
  body: string;
  saving: boolean;
  saveError: string | null;
  saved: FamilySermonDiscussion | null;
  onBack: () => void;
  onSave: () => void;
  onDone: () => void;
  onOpen: () => void;
}

const CONSENT_TEXT = 'This is saved privately to your Family Profile. Only you can see it in SOLAPATH.';
const CONSENT_DETAIL = 'Your recording, audio, transcript, and full Sermon Insights stay private on your device and are not included.';

export default function FamilyDiscussionPreviewStep({
  sermonTitle, mainPoint, scriptures, question, body, saving, saveError, saved, onBack, onSave, onDone, onOpen,
}: Props) {
  if (saved) {
    return (
      <div className="premium-card p-6 animate-fade-in-up text-center">
        <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
          <Check size={20} className="text-gold-300" />
        </div>
        <p className="font-serif text-xl text-ivory-50 mb-2">Saved to Family</p>
        <p className="text-ivory-400 text-sm leading-relaxed mb-6">This discussion is ready whenever your family gathers.</p>
        <div className="flex flex-col gap-2">
          <button onClick={onOpen} className="btn-primary w-full">Open Family Discussion</button>
          <button onClick={onDone} className="btn-secondary w-full">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <p className="text-ivory-400 text-sm leading-relaxed mb-5">This is exactly what will be saved to your Family Profile.</p>

      <div className="mb-4">
        <FamilyDiscussionContent
          sermonTitle={sermonTitle}
          mainPoint={mainPoint}
          scriptures={scriptures}
          question={question}
          body={body}
        />
      </div>

      <div className="premium-card p-4 mb-6 flex items-start gap-3">
        <Lock size={14} className="text-gold-400/70 shrink-0 mt-0.5" />
        <div>
          <p className="text-ivory-100 text-sm leading-relaxed mb-1">{CONSENT_TEXT}</p>
          <p className="text-ivory-400 text-xs leading-relaxed">{CONSENT_DETAIL}</p>
        </div>
      </div>

      {saveError && (
        <div className="flex items-start gap-2 mb-4 px-1" role="alert">
          <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
          <p className="text-ivory-300 text-xs leading-relaxed">{saveError}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button onClick={onSave} disabled={saving} className="btn-primary w-full disabled:opacity-40">
          {saving ? 'Saving...' : saveError ? 'Try Again' : 'Save to Family'}
        </button>
        <button onClick={onBack} disabled={saving} className="btn-secondary w-full disabled:opacity-40">Back</button>
      </div>
    </div>
  );
}
