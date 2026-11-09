import { Check } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { DISCUSSION_SCRIPTURE_MAX, type DiscussionSelection } from '@/lib/sermonDiscussion';

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
          <OptionRow
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
              <OptionRow
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
                <OptionRow
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
          <p className="ui-label mb-3 px-1">One question</p>
          <div className="flex flex-col gap-2">
            {questionOptions.map((question, index) => (
              <OptionRow
                key={index}
                kind="radio"
                selected={selection.question === question}
                onClick={() => onChange({ ...selection, question: selection.question === question ? null : question })}
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

function OptionRow({
  kind, selected, disabled = false, onClick, label,
}: { kind: 'checkbox' | 'radio'; selected: boolean; disabled?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role={kind}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`premium-card p-4 flex items-start gap-3 text-left transition-all duration-300 disabled:opacity-40 ${selected ? 'border-gold-500/50' : 'hover:border-gold-500/30'}`}
    >
      <span className={`mt-0.5 w-4 h-4 shrink-0 flex items-center justify-center border ${kind === 'radio' ? 'rounded-full' : 'rounded-[4px]'} ${selected ? 'border-gold-400 bg-gold-400/20' : 'border-ivory-600'}`}>
        {selected && <Check size={11} className="text-gold-300" />}
      </span>
      <span className="text-ivory-100 text-sm leading-snug">{label}</span>
    </button>
  );
}
