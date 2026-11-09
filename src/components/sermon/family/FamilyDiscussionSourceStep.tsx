import { FAMILY_QUESTION_MAX, FAMILY_SCRIPTURE_MAX, type FamilySelection } from '@/lib/familySermonDiscussion';
import { vibrate } from '@/lib/utils';
import DiscussionOptionRow from '@/components/sermon/discussion/DiscussionOptionRow';

interface Props {
  hasTitle: boolean;
  sermonTitle: string | null;
  mainPointOptions: string[];
  scriptureOptions: string[];
  questionOptions: string[];
  selection: FamilySelection;
  error: string | null;
  onChange: (next: FamilySelection) => void;
  onContinue: () => void;
}

export default function FamilySourceStep({
  hasTitle, sermonTitle, mainPointOptions, scriptureOptions, questionOptions, selection, error, onChange, onContinue,
}: Props) {
  const scripturesFull = selection.scriptures.length >= FAMILY_SCRIPTURE_MAX;

  function toggleScripture(reference: string) {
    vibrate(6);
    const isSelected = selection.scriptures.includes(reference);
    onChange({
      ...selection,
      scriptures: isSelected
        ? selection.scriptures.filter((r) => r !== reference)
        : [...selection.scriptures, reference],
    });
  }

  return (
    <div className="animate-fade-in-up">
      <p className="text-ivory-400 text-sm leading-relaxed mb-5">Pick only what you want to talk through at home. Your summary, transcript, audio, and sermon details are never included.</p>

      {hasTitle && (
        <section className="mb-6">
          <p className="ui-label mb-3 px-1">Sermon title</p>
          <DiscussionOptionRow
            kind="checkbox"
            selected={selection.includeTitle}
            onClick={() => onChange({ ...selection, includeTitle: !selection.includeTitle })}
            label={sermonTitle ?? ''}
          />
        </section>
      )}

      {mainPointOptions.length > 0 && (
        <section className="mb-6">
          <p className="ui-label mb-3 px-1">One main point</p>
          <div className="flex flex-col gap-2">
            {mainPointOptions.map((title, index) => (
              <DiscussionOptionRow
                key={`${title}-${index}`}
                kind="radio"
                selected={selection.mainPoint === title}
                onClick={() => onChange({ ...selection, mainPoint: selection.mainPoint === title ? null : title })}
                label={title}
              />
            ))}
          </div>
        </section>
      )}

      {scriptureOptions.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="ui-label">Scripture to read</p>
            <p className="text-ivory-600 text-xs">{selection.scriptures.length} of {FAMILY_SCRIPTURE_MAX}</p>
          </div>
          <div className="flex flex-col gap-2">
            {scriptureOptions.map((reference) => {
              const selected = selection.scriptures.includes(reference);
              return (
                <DiscussionOptionRow
                  key={reference}
                  kind="checkbox"
                  selected={selected}
                  disabled={!selected && scripturesFull}
                  onClick={() => toggleScripture(reference)}
                  label={reference}
                />
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-6">
        <p className="ui-label mb-3 px-1">One question to talk about</p>
        <div className="flex flex-col gap-2">
          <DiscussionOptionRow
            kind="radio"
            selected={selection.questionMode === 'none'}
            onClick={() => onChange({ ...selection, questionMode: 'none' })}
            label="No question"
          />
          {questionOptions.map((question, index) => (
            <DiscussionOptionRow
              key={index}
              kind="radio"
              selected={selection.questionMode === 'existing' && selection.existingQuestion === question}
              onClick={() => onChange({ ...selection, questionMode: 'existing', existingQuestion: question })}
              label={question}
            />
          ))}
          <DiscussionOptionRow
            kind="radio"
            selected={selection.questionMode === 'custom'}
            onClick={() => onChange({ ...selection, questionMode: 'custom' })}
            label="Write my own question"
          />
        </div>
        {selection.questionMode === 'custom' && (
          <div className="premium-card p-4 mt-2">
            <label htmlFor="family-custom-question" className="ui-label block mb-2">Your question</label>
            <textarea
              id="family-custom-question"
              value={selection.customQuestion}
              onChange={(e) => onChange({ ...selection, customQuestion: e.target.value.slice(0, FAMILY_QUESTION_MAX) })}
              rows={3}
              className="w-full bg-transparent text-ivory-100 text-sm leading-[1.5] placeholder:text-ivory-600 resize-none focus:outline-none"
              placeholder="What would you like your family to think about?"
            />
            <div className="flex justify-end mt-2">
              <p className={`text-xs ${selection.customQuestion.length >= FAMILY_QUESTION_MAX ? 'text-error' : 'text-ivory-600'}`}>
                {selection.customQuestion.length} / {FAMILY_QUESTION_MAX}
              </p>
            </div>
          </div>
        )}
      </section>

      {error && (
        <p className="text-ivory-300 text-xs leading-relaxed mb-4 px-1" role="alert">{error}</p>
      )}

      <button onClick={() => { vibrate(8); onContinue(); }} className="btn-primary w-full mt-2">Continue</button>
    </div>
  );
}
