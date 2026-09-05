import { X, BookOpen, ChevronRight } from 'lucide-react';
import type { BiblicalBasisPassage } from '@/lib/intelligenceTypes';
import { getBookDisplayName, type BibleTranslation } from '@/lib/bibleTypes';
import { parsePassageReference } from '@/lib/passageParser';

interface BiblicalBasisProps {
  passages: BiblicalBasisPassage[];
  onClose: () => void;
  onOpenBible: (reference: string) => void;
  translation?: BibleTranslation;
  lang?: 'en' | 'es';
}

function localizeRef(ref: string, translation: BibleTranslation): string {
  const parsed = parsePassageReference(ref);
  if (!parsed || parsed.verseStart === null) return ref;
  const bookName = getBookDisplayName(parsed.book, translation);
  if (parsed.verseStart === parsed.verseEnd) {
    return `${bookName} ${parsed.chapter}:${parsed.verseStart}`;
  }
  return `${bookName} ${parsed.chapter}:${parsed.verseStart}\u2013${parsed.verseEnd}`;
}

export default function BiblicalBasis({ passages, onClose, onOpenBible, translation = 'WEB', lang = 'en' }: BiblicalBasisProps) {
  const primary = passages.filter((p) => p.is_primary);
  const supporting = passages.filter((p) => !p.is_primary);
  const L = lang === 'es' ? {
    title: 'Base Bíblica',
    primary: 'Pasajes principales',
    supporting: 'Pasajes complementarios',
    empty: 'Los pasajes de base bíblica aparecerán aquí cuando el motor de inteligencia esté conectado.',
    note: 'SOLAPATH evita usar textos fuera de contexto. Cuando sea posible, lee el capítulo completo para entender cada pasaje en su contexto.',
  } : {
    title: 'Biblical Basis',
    primary: 'Primary Passages',
    supporting: 'Supporting Passages',
    empty: 'Biblical basis passages will appear here when the full intelligence engine is connected.',
    note: 'SOLAPATH avoids proof-texting. Where possible, read the surrounding chapter to understand each passage in context.',
  };

  return (
    <div className="fixed inset-0 z-[80] bg-ink-950/90 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-ink-900 border border-ink-700/50 rounded-t-3xl animate-slide-up">
        <div className="sticky top-0 bg-ink-900/95 backdrop-blur-md px-6 py-4 border-b border-ink-700/40 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ivory-50">{L.title}</h2>
          <button onClick={onClose} className="btn-ghost">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {passages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-ink-800/50 border border-ink-700/40 flex items-center justify-center mb-5">
                <BookOpen size={22} className="text-ivory-600" />
              </div>
              <p className="text-ivory-400 text-sm">
                {L.empty}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {primary.length > 0 && (
                <div>
                  <p className="ui-label mb-3">{L.primary}</p>
                  <div className="flex flex-col gap-3">
                    {primary.map((p, i) => (
                      <div key={i} className="premium-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-serif text-lg text-ivory-50 mb-1">{localizeRef(p.reference, translation)}</h3>
                            <p className="text-ivory-300 text-xs leading-relaxed mb-2">{p.relevance}</p>
                            <div className="flex items-start gap-1.5 mt-2">
                              <BookOpen size={12} className="text-gold-400/60 shrink-0 mt-0.5" />
                              <p className="text-ivory-500 text-xs italic leading-relaxed">{p.contextual_note}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onOpenBible(p.reference)}
                            className="btn-ghost text-xs shrink-0"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {supporting.length > 0 && (
                <div>
                  <p className="ui-label mb-3">{L.supporting}</p>
                  <div className="flex flex-col gap-2">
                    {supporting.map((p, i) => (
                      <div key={i} className="premium-card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-serif text-base text-ivory-200 mb-0.5">{localizeRef(p.reference, translation)}</h3>
                            <p className="text-ivory-500 text-xs leading-relaxed">{p.relevance}</p>
                            <p className="text-ivory-600 text-xs italic mt-1.5">{p.contextual_note}</p>
                          </div>
                          <button
                            onClick={() => onOpenBible(p.reference)}
                            className="btn-ghost text-xs shrink-0"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 px-1 mt-2">
                <BookOpen size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-600 text-xs leading-relaxed">
                  {L.note}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
