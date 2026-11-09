import { useState } from 'react';
import { X, BookOpen, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState } from '@/components/States';
import SermonConfirmSheet from '@/components/sermon/SermonConfirmSheet';
import { parsePassageReference } from '@/lib/passageParser';
import {
  buildSermonStudy, STUDY_FAILURE_MESSAGE, STUDY_NO_SOURCE_MESSAGE, STUDY_UNCLEAR_MESSAGE,
  type OpenBibleHandler, type SermonStudy, type StudyTheme,
} from '@/lib/sermonStudy';
import type { SermonInsights, SermonRecordingMeta } from '@/lib/sermonRecordingStore';

interface Props {
  meta: SermonRecordingMeta;
  insights: SermonInsights;
  onBack: () => void;
  onOpenBible: OpenBibleHandler;
}

const REFRESH_FAILURE_MESSAGE = 'The study could not be refreshed. Your previous study is still shown.';

export default function SermonStudyScreen({ meta, insights, onBack, onOpenBible }: Props) {
  const [study, setStudy] = useState<SermonStudy | null>(null);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  async function runStudy() {
    if (running) return;
    setRunning(true);
    setFailed(false);
    setRefreshError(null);
    try {
      const next = await buildSermonStudy(insights);
      setStudy(next);
    } catch {
      if (study) setRefreshError(REFRESH_FAILURE_MESSAGE);
      else setFailed(true);
    } finally {
      setRunning(false);
    }
  }

  function handleRefresh() {
    setConfirmRefresh(false);
    void runStudy();
  }

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

          {!study && !running && !failed && (
            <section className="premium-card p-5 mb-4">
              <p className="ui-label mb-3">Optional Study</p>
              <p className="text-ivory-300 text-sm leading-[1.5] mb-5">
                This compares the sermon's main points and Scripture references with SOLAPATH's verified sources. It does not grade the sermon or the preacher. Your recording and transcript are not changed.
              </p>
              <button onClick={() => { vibrate(8); void runStudy(); }} className="btn-primary w-full">
                <Sparkles size={16} /> Start Study
              </button>
            </section>
          )}

          {running && <LoadingState message="Looking up verified sources..." />}

          {failed && (
            <div className="premium-card p-5 mb-4">
              <div className="flex items-start gap-2 mb-4">
                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                <p className="text-ivory-300 text-sm leading-relaxed">{STUDY_FAILURE_MESSAGE}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => void runStudy()} className="btn-primary w-full">Try Again</button>
                <button onClick={onBack} className="btn-secondary w-full">Cancel</button>
              </div>
            </div>
          )}

          {study && (
            <>
              {refreshError && (
                <div className="flex items-start gap-2 mb-4 px-1">
                  <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                  <p className="text-ivory-300 text-xs leading-relaxed">{refreshError}</p>
                </div>
              )}

              <section className="premium-card p-5 mb-4">
                <SourceLabel label="From the sermon" />
                <p className="text-ivory-200 text-sm leading-[1.5] whitespace-pre-line mt-3">{insights.summary}</p>
                {study.themes.length > 0 && (
                  <>
                    <p className="ui-label mt-5 mb-2">Central Themes</p>
                    <ul className="flex flex-col gap-2">
                      {study.themes.map((theme, index) => (
                        <li key={`${theme.title}-${index}`} className="text-ivory-200 text-sm leading-[1.5]">{theme.title}</li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              <section className="mb-4">
                <div className="flex items-center justify-between px-1 mb-3">
                  <p className="ui-label">Scripture Mentioned</p>
                  <SourceLabel label="Scripture" />
                </div>
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

              <section className="mb-4">
                <p className="ui-label mb-3 px-1">Explore the Teaching</p>
                {study.themes.length === 0 ? (
                  <div className="premium-card p-5">
                    <p className="text-ivory-400 text-sm leading-relaxed">{STUDY_UNCLEAR_MESSAGE}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {study.themes.map((theme, index) => (
                      <ThemeCard key={`${theme.title}-${index}`} theme={theme} />
                    ))}
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
                <section className="premium-card p-5 mb-4">
                  <p className="ui-label mb-2">Questions for Your Pastor</p>
                  <p className="text-ivory-500 text-xs leading-relaxed mb-3">Respectful questions to help you understand the sermon. They are not accusations.</p>
                  <ul className="flex flex-col gap-3">
                    {study.pastorQuestions.map((question, index) => (
                      <li key={index} className="text-ivory-200 text-sm leading-[1.5]">{question}</li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="flex flex-col gap-2 mb-8">
                <button onClick={() => { vibrate(8); setConfirmRefresh(true); }} disabled={running} className="btn-secondary w-full disabled:opacity-40">
                  <RefreshCw size={16} /> Refresh Study
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SermonConfirmSheet
        open={confirmRefresh}
        title="Refresh this sermon study?"
        body="SOLAPATH will re-examine the current sermon transcript and verified sources. Your recording and transcript will not be changed."
        confirmLabel="Refresh"
        busy={running}
        onConfirm={handleRefresh}
        onCancel={() => setConfirmRefresh(false)}
      />
    </div>
  );
}

function SourceLabel({ label }: { label: string }) {
  return <span className="inline-block text-[11px] uppercase tracking-wide text-gold-400 border border-gold-400/40 rounded-full px-2.5 py-1">{label}</span>;
}

function ThemeCard({ theme }: { theme: StudyTheme }) {
  return (
    <div className="premium-card p-5">
      <p className="text-ivory-50 text-sm font-medium leading-snug mb-4">{theme.title}</p>
      {theme.sources.length === 0 ? (
        <p className="text-ivory-400 text-xs leading-relaxed">{STUDY_NO_SOURCE_MESSAGE}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {theme.sources.map((source) => (
            <li key={`${source.id}-${source.title}`} className="border-t border-ivory-500/10 pt-3 first:border-t-0 first:pt-0">
              <p className="text-ivory-500 text-[11px] uppercase tracking-wide mb-1">{source.category}</p>
              <p className="text-ivory-100 text-sm leading-snug">{source.title}</p>
              <p className="text-ivory-400 text-xs mt-1">
                {[source.author, source.section].filter(Boolean).join(' · ')}
              </p>
              <p className="text-gold-400 text-[11px] mt-1.5">Verified</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
