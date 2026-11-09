import { useState } from 'react';
import { X, BookOpen, Sparkles } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { parsePassageReference } from '@/lib/passageParser';
import { buildSermonStudy, STUDY_UNCLEAR_MESSAGE, type OpenBibleHandler, type SermonStudy } from '@/lib/sermonStudy';
import type { SermonInsights, SermonRecordingMeta } from '@/lib/sermonRecordingStore';

interface Props {
  meta: SermonRecordingMeta;
  insights: SermonInsights;
  onBack: () => void;
  onOpenBible: OpenBibleHandler;
}

export default function SermonStudyScreen({ meta, insights, onBack, onOpenBible }: Props) {
  const [study, setStudy] = useState<SermonStudy | null>(null);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Back"><X size={20} /></button>
        <p className="ui-label">Study This Sermon</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="mb-6">
            <p className="font-serif text-2xl text-ivory-50 leading-tight">{meta.title || 'Untitled Sermon'}</p>
            <p className="text-ivory-500 text-xs mt-2">
              {[meta.preacher, formatDate(meta.startedAt)].filter(Boolean).join(' · ')}
            </p>
          </div>

          {!study && (
            <section className="premium-card p-5 mb-4">
              <p className="ui-label mb-3">Optional Study</p>
              <p className="text-ivory-300 text-sm leading-[1.5] mb-5">
                This looks at the Scripture and main points from your sermon. It does not grade the sermon or the preacher. Your recording and transcript are not changed.
              </p>
              <button onClick={() => { vibrate(8); setStudy(buildSermonStudy(insights)); }} className="btn-primary w-full">
                <Sparkles size={16} /> Start Study
              </button>
            </section>
          )}

          {study && (
            <>
              <section className="premium-card p-5 mb-4">
                <SourceLabel label="From the sermon" />
                <p className="ui-label mt-5 mb-2">Sermon Focus</p>
                {study.themes.length === 0 ? (
                  <p className="text-ivory-400 text-sm leading-relaxed">{STUDY_UNCLEAR_MESSAGE}</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {study.themes.map((theme, index) => (
                      <li key={`${theme}-${index}`} className="text-ivory-200 text-sm leading-[1.5]">{theme}</li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="mb-4">
                <p className="ui-label mb-3 px-1">Scripture Mentioned</p>
                {insights.scriptureReferences.length === 0 ? (
                  <div className="premium-card p-5">
                    <p className="text-ivory-400 text-sm leading-relaxed">No Scripture references were identified in this sermon.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {insights.scriptureReferences.map((ref, index) => {
                      const passage = parsePassageReference(ref.reference);
                      return (
                        <div key={`${ref.reference}-${index}`} className="premium-card p-5">
                          <p className="font-serif text-ivory-50 text-lg mb-1.5">{ref.reference}</p>
                          <p className="text-ivory-300 text-sm leading-[1.5] mb-4">{ref.context}</p>
                          {passage && (
                            <button
                              onClick={() => { vibrate(8); onOpenBible(passage.book, passage.chapter, passage.verseStart, passage.verseEnd); }}
                              className="btn-secondary w-full"
                            >
                              <BookOpen size={16} /> Open in Bible
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="premium-card p-5 mb-4">
                <p className="ui-label mb-3">Questions for Further Study</p>
                <ul className="flex flex-col gap-3">
                  {study.studyQuestions.map((question, index) => (
                    <li key={index} className="text-ivory-200 text-sm leading-[1.5]">{question}</li>
                  ))}
                </ul>
              </section>

              {study.pastorQuestions.length > 0 && (
                <section className="premium-card p-5 mb-8">
                  <p className="ui-label mb-2">Questions for Your Pastor</p>
                  <p className="text-ivory-500 text-xs leading-relaxed mb-3">Respectful questions to help you understand the sermon. They are not accusations.</p>
                  <ul className="flex flex-col gap-3">
                    {study.pastorQuestions.map((question, index) => (
                      <li key={index} className="text-ivory-200 text-sm leading-[1.5]">{question}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceLabel({ label }: { label: string }) {
  return <span className="inline-block text-[11px] uppercase tracking-wide text-gold-400 border border-gold-400/40 rounded-full px-2.5 py-1">{label}</span>;
}
