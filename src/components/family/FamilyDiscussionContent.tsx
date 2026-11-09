import { BookOpen } from 'lucide-react';

interface Props {
  sermonTitle: string | null;
  mainPoint: string | null;
  scriptures: string[];
  question: string | null;
  body: string;
  onOpenScripture?: (reference: string) => void;
}

export default function FamilyDiscussionContent({ sermonTitle, mainPoint, scriptures, question, body, onOpenScripture }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <section className="premium-card p-5">
        <p className="ui-label mb-3">From the sermon</p>
        {sermonTitle && <p className="font-serif text-xl text-ivory-50 leading-snug mb-3">{sermonTitle}</p>}
        {mainPoint && <p className="text-ivory-200 text-sm leading-[1.5]">{mainPoint}</p>}
        {!sermonTitle && !mainPoint && <p className="text-ivory-500 text-sm">No sermon point was saved with this discussion.</p>}
      </section>

      {scriptures.length > 0 && (
        <section>
          <p className="ui-label mb-3 px-1">Read Scripture</p>
          <div className="flex flex-col gap-2">
            {scriptures.map((reference) => onOpenScripture ? (
              <button
                key={reference}
                onClick={() => onOpenScripture(reference)}
                className="premium-card p-4 flex items-center justify-between gap-3 text-left hover:border-gold-500/30 transition-all duration-300"
              >
                <span className="font-serif text-ivory-50 text-lg">{reference}</span>
                <span className="flex items-center gap-1.5 text-gold-300 text-xs shrink-0">
                  <BookOpen size={14} /> Open in Bible
                </span>
              </button>
            ) : (
              <span key={reference} className="premium-card p-4 font-serif text-ivory-50 text-lg">{reference}</span>
            ))}
          </div>
        </section>
      )}

      <section className="premium-card p-5">
        <p className="ui-label mb-3">Talk about it</p>
        {question && <p className="font-serif text-lg text-ivory-50 leading-snug mb-4">{question}</p>}
        <p className="text-ivory-200 text-sm leading-[1.5] whitespace-pre-line">{body}</p>
      </section>

      <section className="premium-card p-5">
        <p className="ui-label mb-3">Pray Together</p>
        <p className="text-ivory-400 text-sm leading-[1.5]">Close by praying together as a family. Use your own words.</p>
      </section>
    </div>
  );
}
