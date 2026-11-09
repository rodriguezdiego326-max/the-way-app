import { AlertCircle } from 'lucide-react';
import { DISCUSSION_BODY_MAX } from '@/lib/sermonDiscussion';

interface Props {
  heading: string;
  body: string;
  error: string | null;
  onChange: (next: string) => void;
  onContinue: () => void;
}

export default function DiscussionEditStep({ heading, body, error, onChange, onContinue }: Props) {
  const length = body.length;

  return (
    <div className="animate-fade-in-up">
      <p className="text-ivory-50 font-medium text-sm mb-1">{heading}</p>
      <p className="text-ivory-400 text-sm leading-relaxed mb-5">This starter is built from what you selected. Edit it in your own words before you share.</p>

      <div className="premium-card p-5 mb-3">
        <label htmlFor="discussion-starter" className="ui-label block mb-3">Your starter</label>
        <textarea
          id="discussion-starter"
          value={body}
          onChange={(e) => onChange(e.target.value.slice(0, DISCUSSION_BODY_MAX))}
          rows={9}
          className="w-full bg-transparent text-ivory-100 text-sm leading-[1.5] placeholder:text-ivory-600 resize-none focus:outline-none"
          placeholder="Write what you want your Circle to think about..."
        />
        <div className="flex justify-end mt-2">
          <p className={`text-xs ${length >= DISCUSSION_BODY_MAX ? 'text-error' : 'text-ivory-600'}`}>{length} / {DISCUSSION_BODY_MAX}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 mb-4 px-1" role="alert">
          <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
          <p className="text-ivory-300 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      <button onClick={onContinue} className="btn-primary w-full mt-2">Preview</button>
    </div>
  );
}
