import { useState } from 'react';
import { X, Copy, Check, RefreshCw, AlertCircle, BookOpen, MessageSquare } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import type { SermonRecordingMeta } from '@/lib/sermonRecordingStore';
import type { SermonInsightsState } from '@/hooks/useSermonInsights';
import { formatSermonInsightsText } from '@/lib/sermonInsights';
import { buildSermonAskHandoff, type SermonAskHandoff } from '@/lib/askHandoff';
import SermonConfirmSheet from '@/components/sermon/SermonConfirmSheet';

interface Props {
  meta: SermonRecordingMeta;
  insights: SermonInsightsState;
  onBack: () => void;
  onStudy: () => void;
  onContinueInAsk: (handoff: SermonAskHandoff) => void;
}

const STAGE_LABELS = {
  reading: 'Reading transcript...',
  creating: 'Creating sermon insights...',
  finalizing: 'Finalizing...',
} as const;

const CONFIDENCE_LABELS = {
  explicit: 'Mentioned in sermon',
  likely: 'Likely reference',
} as const;

export default function SermonInsightsScreen({ meta, insights, onBack, onStudy, onContinueInAsk }: Props) {
  const { record, stage, error, isGenerating, generate, clearError } = insights;
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmAsk, setConfirmAsk] = useState(false);
  const [askStarting, setAskStarting] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const content = record?.insights ?? null;

  async function handleCopy() {
    if (!content) return;
    vibrate(8);
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(formatSermonInsightsText(content, meta.title || 'Sermon Insights'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError('The insights could not be copied on this device.');
    }
  }

  async function handleRegenerate() {
    setConfirmRegenerate(false);
    await generate();
  }

  function handleConfirmAsk() {
    if (!content || askStarting) return;
    setAskStarting(true);
    setAskError(null);
    try {
      onContinueInAsk(buildSermonAskHandoff(meta.title, content));
    } catch {
      setAskError("We couldn't open this sermon in Ask. Your sermon insights are safe. Please try again.");
      setAskStarting(false);
      setConfirmAsk(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Back"><X size={20} /></button>
        <p className="ui-label">Sermon Insights</p>
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

          {isGenerating && stage && (
            <div className="premium-card p-5 mb-4" role="status" aria-live="polite">
              <p className="text-ivory-200 text-sm">{STAGE_LABELS[stage]}</p>
            </div>
          )}

          {error && (
            <div className="premium-card p-5 mb-4">
              <div className="flex items-start gap-2 mb-4">
                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                <p className="text-ivory-300 text-sm leading-relaxed">{error}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => { clearError(); void generate(); }} disabled={isGenerating} className="btn-primary w-full disabled:opacity-40">Try Again</button>
                <button onClick={() => { clearError(); onBack(); }} disabled={isGenerating} className="btn-secondary w-full disabled:opacity-40">Cancel</button>
              </div>
            </div>
          )}

          {!content && !isGenerating && !error && (
            <div className="premium-card p-5 mb-4">
              <p className="text-ivory-400 text-sm leading-relaxed">No sermon insights are available for this transcript yet.</p>
            </div>
          )}

          {content && (
            <>
              <section className="premium-card p-5 mb-4">
                <p className="ui-label mb-3">Summary</p>
                <p className="text-ivory-200 text-sm leading-[1.5] whitespace-pre-line">{content.summary}</p>
              </section>

              {content.mainPoints.length > 0 && (
                <section className="mb-4">
                  <p className="ui-label mb-3 px-1">Main Points</p>
                  <div className="flex flex-col gap-3">
                    {content.mainPoints.map((point, index) => (
                      <div key={`${point.title}-${index}`} className="premium-card p-5 flex gap-4">
                        <span className="font-serif text-gold-400 text-lg leading-none">{index + 1}</span>
                        <div>
                          <p className="text-ivory-50 text-sm font-medium leading-snug">{point.title}</p>
                          <p className="text-ivory-300 text-sm leading-[1.5] mt-1.5">{point.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {content.scriptureReferences.length > 0 && (
                <section className="mb-4">
                  <p className="ui-label mb-3 px-1">Scriptures Mentioned</p>
                  <div className="flex flex-col gap-3">
                    {content.scriptureReferences.map((ref, index) => (
                      <div key={`${ref.reference}-${index}`} className="premium-card p-5">
                        <div className="flex items-baseline justify-between gap-3 mb-1.5">
                          <p className="font-serif text-ivory-50 text-lg">{ref.reference}</p>
                          {ref.confidence !== 'explicit' && (
                            <span className="text-ivory-500 text-[11px] uppercase tracking-wide shrink-0">{CONFIDENCE_LABELS[ref.confidence]}</span>
                          )}
                        </div>
                        <p className="text-ivory-300 text-sm leading-[1.5]">{ref.context}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {content.applicationTakeaways.length > 0 && (
                <section className="premium-card p-5 mb-4">
                  <p className="ui-label mb-3">Application</p>
                  <ul className="flex flex-col gap-3">
                    {content.applicationTakeaways.map((item, index) => (
                      <li key={index} className="text-ivory-200 text-sm leading-[1.5] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-gold-400">{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {content.reflectionQuestions.length > 0 && (
                <section className="mb-4">
                  <p className="ui-label mb-3 px-1">Reflect</p>
                  <div className="flex flex-col gap-3">
                    {content.reflectionQuestions.map((question, index) => (
                      <div key={index} className="premium-card p-5">
                        <p className="text-ivory-200 text-sm leading-[1.5]">{question}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {content.limitations.length > 0 && (
                <section className="premium-card p-5 mb-4">
                  <p className="ui-label mb-3">Limitations</p>
                  <ul className="flex flex-col gap-2">
                    {content.limitations.map((item, index) => (
                      <li key={index} className="text-ivory-400 text-xs leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="text-ivory-500 text-xs leading-relaxed mb-5 px-1">
                Generated from your transcript. Compare important points with the sermon and Scripture.
              </p>

              {askError && (
                <div className="flex items-start gap-2 mb-3 px-1">
                  <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                  <p className="text-ivory-300 text-xs leading-relaxed">{askError}</p>
                </div>
              )}

              {copyError && (
                <div className="flex items-start gap-2 mb-3 px-1">
                  <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                  <p className="text-ivory-300 text-xs leading-relaxed">{copyError}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 mb-8">
                <button onClick={() => { vibrate(8); onStudy(); }} disabled={isGenerating} className="btn-primary w-full disabled:opacity-40">
                  <BookOpen size={16} /> Study This Sermon With Scripture
                </button>
                <button onClick={() => { vibrate(8); setConfirmAsk(true); }} disabled={isGenerating || askStarting} className="btn-secondary w-full disabled:opacity-40">
                  <MessageSquare size={16} /> Continue in Ask
                </button>
                <button onClick={handleCopy} disabled={isGenerating} className="btn-primary w-full disabled:opacity-40">
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Insights</>}
                </button>
                <button onClick={() => { vibrate(8); setConfirmRegenerate(true); }} disabled={isGenerating} className="btn-secondary w-full disabled:opacity-40">
                  <RefreshCw size={16} /> Regenerate Insights
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SermonConfirmSheet
        open={confirmAsk}
        title="Continue this sermon in Ask?"
        body={<>
          <p>SOLAPATH will start a new Ask conversation using a short summary of these sermon insights, the main-point titles, and the Scripture references identified from the sermon. Your audio and full transcript stay in Sermon Assistant.</p>
          <p>The sermon is treated as church content, not as Scripture or a verified theological source.</p>
        </>}
        confirmLabel="Continue in Ask"
        busy={askStarting}
        onConfirm={handleConfirmAsk}
        onCancel={() => setConfirmAsk(false)}
      />

      <SermonConfirmSheet
        open={confirmRegenerate}
        title="Regenerate sermon insights?"
        body="This will replace the current generated insights. Your transcript and recording will not be changed."
        confirmLabel="Regenerate"
        busy={isGenerating}
        onConfirm={handleRegenerate}
        onCancel={() => setConfirmRegenerate(false)}
      />
    </div>
  );
}
