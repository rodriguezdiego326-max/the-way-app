import { vibrate } from '@/lib/utils';
import { DISCUSSION_SCRIPTURE_MAX, type DiscussionSelection } from '@/lib/sermonDiscussion';
import DiscussionOptionRow from '@/components/sermon/discussion/DiscussionOptionRow';

interface Props {
  hasTitle: boolean;
  sermonTitle: string | null;
  mainPointOptions: string[];
  scriptureOptions: string[];
  questionOptions: string[];
  selection: DiscussionSelection;
  onChange: (next: DiscussionSelection) => void;
  onContinue: () => void;
}

export default function DiscussionSourceStep({
  hasTitle, sermonTitle, mainPointOptions, scriptureOptions, questionOptions, selection, onChange, onContinue,
}: Props) {
  const scripturesFull = selection.scriptures.length >= DISCUSSION_SCRIPTURE_MAX;

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
      <p className="text-ivory-400 text-sm leading-relaxed mb-5">Pick only what you want your Circle to see. Your summary, transcript, audio, and sermon details are never included.</p>

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
            <p className="text-ivory-600 text-xs">{selection.scriptures.length} of {DISCUSSION_SCRIPTURE_MAX}</p>
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

      {questionOptions.length > 0 && (
        <section className="mb-6">
          <p className="ui-label mb-3 px-1">One reflection question</p>
          <div className="flex flex-col gap-2">
            <DiscussionOptionRow
              kind="radio"
              selected={selection.question === null}
              onClick={() => onChange({ ...selection, question: null })}
              label="No question"
            />
            {questionOptions.map((question, index) => (
              <DiscussionOptionRow
                key={index}
                kind="radio"
                selected={selection.question === question}
                onClick={() => onChange({ ...selection, question })}
                label={question}
              />
            ))}
          </div>
        </section>
      )}

      <button onClick={() => { vibrate(8); onContinue(); }} className="btn-primary w-full mt-2">Continue</button>
    </div>
  );
}

