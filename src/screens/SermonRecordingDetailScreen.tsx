import { useEffect, useState } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';
import { vibrate, formatDate, formatDuration } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import SermonPlaybackPanel from '@/components/sermon/SermonPlaybackPanel';
import SermonTranscriptionPanel from '@/components/sermon/SermonTranscriptionPanel';
import SermonConfirmSheet from '@/components/sermon/SermonConfirmSheet';
import SermonTranscriptScreen from '@/screens/SermonTranscriptScreen';
import SermonInsightsScreen from '@/screens/SermonInsightsScreen';
import SermonStudyScreen from '@/screens/SermonStudyScreen';
import type { OpenBibleHandler } from '@/lib/sermonStudy';
import { sermonRecorderNative } from '@/lib/sermonRecorderNative';
import { useSermonTranscription } from '@/hooks/useSermonTranscription';
import { useSermonInsights } from '@/hooks/useSermonInsights';
import { discardServerTranscript } from '@/lib/sermonTranscription';
import {
  getSermonRecording, updateSermonRecordingDetails, deleteSermonRecordingMeta,
  type SermonRecordingMeta,
} from '@/lib/sermonRecordingStore';

import type { SermonAskHandoff } from '@/lib/askHandoff';
import type { Profile } from '@/lib/types';
import type { Circle, CircleSermonDiscussion } from '@/lib/togetherTypes';
import type { FamilySermonDiscussion } from '@/lib/familyTypes';

interface Props {
  recordingId: string;
  fresh: boolean;
  interrupted: boolean;
  initialView?: 'details' | 'insights';
  onDone: () => void;
  onOpenBible: OpenBibleHandler;
  onContinueInAsk: (handoff: SermonAskHandoff) => void;
  profile: Profile | null;
  onViewSharedDiscussion: (circle: Circle, discussion: CircleSermonDiscussion) => void;
  onOpenFamilyDiscussion: (discussion: FamilySermonDiscussion) => void;
}

export default function SermonRecordingDetailScreen({ recordingId, fresh, interrupted, initialView = 'details', onDone, onOpenBible, onContinueInAsk, profile, onViewSharedDiscussion, onOpenFamilyDiscussion }: Props) {
  const [meta, setMeta] = useState<SermonRecordingMeta | null>(null);
  const [legacyBlob, setLegacyBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<'details' | 'transcript' | 'insights' | 'study'>(initialView);

  const [title, setTitle] = useState('');
  const [preacher, setPreacher] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const transcription = useSermonTranscription(recordingId, meta?.fileName ?? null);
  const insights = useSermonInsights(meta, transcription.transcript);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getSermonRecording(recordingId)
      .then((record) => {
        if (cancelled) return;
        if (!record) {
          setLoadError('This recording could not be found on this device.');
          return;
        }
        setMeta(record.meta);
        setLegacyBlob(record.legacyBlob);
        setTitle(record.meta.title ?? '');
        setPreacher(record.meta.preacher ?? '');
        setServiceName(record.meta.serviceName ?? '');
      })
      .catch(() => { if (!cancelled) setLoadError('Could not open this recording.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [recordingId]);

  async function handleSave() {
    if (!meta || saving) return;
    vibrate(12);
    setSaving(true);
    setSaveError(null);
    try {
      await updateSermonRecordingDetails(meta.id, {
        title: title.trim() || null,
        preacher: preacher.trim() || null,
        serviceName: serviceName.trim() || null,
      });
      onDone();
    } catch {
      setSaveError('Your changes could not be saved on this device. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!meta || deleting) return;
    vibrate(15);
    setDeleting(true);
    setDeleteError(null);
    try {
      if (transcription.status !== 'idle') await transcription.cancel();
      if (meta.fileName) {
        await sermonRecorderNative.deleteRecording({ fileName: meta.fileName });
      }
      await deleteSermonRecordingMeta(meta.id);
      await discardServerTranscript(meta.id);
      onDone();
    } catch {
      setDeleteError('This recording could not be deleted. Please try again.');
      setDeleting(false);
    }
  }

  if (meta && view === 'transcript') {
    return (
      <SermonTranscriptScreen
        meta={meta}
        transcription={transcription}
        insights={insights}
        onBack={() => setView('details')}
        onOpenInsights={() => setView('insights')}
      />
    );
  }

  if (meta && view === 'insights') {
    return (
      <SermonInsightsScreen
        meta={meta}
        insights={insights}
        profile={profile}
        onBack={() => setView('transcript')}
        onStudy={() => setView('study')}
        onContinueInAsk={onContinueInAsk}
        onViewSharedDiscussion={onViewSharedDiscussion}
        onOpenFamilyDiscussion={onOpenFamilyDiscussion}
      />
    );
  }

  if (meta && view === 'study' && insights.record) {
    return (
      <SermonStudyScreen
        key={insights.record.createdAt}
        meta={meta}
        insights={insights.record.insights}
        onBack={() => setView('insights')}
        onOpenBible={onOpenBible}
      />
    );
  }

  const headerLabel = fresh ? 'Recording Complete' : 'Sermon Recording';

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onDone} className="btn-ghost" aria-label="Close"><X size={20} /></button>
        <p className="ui-label">{headerLabel}</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          {loading && <LoadingState message="Opening recording..." />}
          {!loading && loadError && <ErrorState message={loadError} onRetry={onDone} />}

          {!loading && meta && (
            <>
              {interrupted && (
                <div className="flex items-start gap-2 mb-4 px-1">
                  <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                  <p className="text-ivory-300 text-xs leading-relaxed">
                    iPhone stopped the recording, for example during a phone call. The audio captured before that point was saved.
                  </p>
                </div>
              )}

              <div className="premium-card p-5 mb-4">
                <p className="font-serif text-2xl text-ivory-50 leading-tight">{meta.title || 'Untitled Sermon'}</p>
                <p className="text-ivory-500 text-xs mt-2">
                  {formatDate(meta.startedAt)} · {formatDuration(meta.durationMs)}
                </p>
              </div>

              <SermonPlaybackPanel meta={meta} legacyBlob={legacyBlob} />

              <SermonTranscriptionPanel
                meta={meta}
                transcription={transcription}
                onOpenTranscript={() => setView('transcript')}
              />

              <div className="premium-card p-5 mb-4">
                <p className="ui-label mb-4">Details</p>
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-ivory-400 text-xs">Sermon title</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled Sermon" className="input-field" maxLength={120} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-ivory-400 text-xs">Preacher</span>
                    <input value={preacher} onChange={(e) => setPreacher(e.target.value)} placeholder="Optional" className="input-field" maxLength={120} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-ivory-400 text-xs">Church or service</span>
                    <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Optional" className="input-field" maxLength={120} />
                  </label>
                </div>
              </div>

              {saveError && (
                <div className="flex items-start gap-2 mb-3 px-1">
                  <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                  <p className="text-ivory-300 text-xs leading-relaxed">{saveError}</p>
                </div>
              )}
              <button onClick={handleSave} disabled={saving} className="btn-primary w-full mb-3 disabled:opacity-40">
                {saving ? 'Saving...' : fresh ? 'Save Recording' : 'Save Changes'}
              </button>

              {deleteError && (
                <div className="flex items-start gap-2 mb-3 px-1">
                  <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                  <p className="text-ivory-300 text-xs leading-relaxed">{deleteError}</p>
                </div>
              )}
              <button onClick={() => { vibrate(8); setConfirmDeleteOpen(true); }} disabled={deleting} className="btn-secondary w-full text-clay-400 mb-8 disabled:opacity-40">
                <Trash2 size={16} /> {fresh ? 'Delete Recording' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      <SermonConfirmSheet
        open={confirmDeleteOpen}
        title={transcription.transcript ? 'Delete this recording and its transcript?' : 'Delete this recording?'}
        body={transcription.transcript
          ? 'This permanently deletes the audio, the transcript, and any sermon insights from this device.'
          : 'This permanently deletes the audio from this device.'}
        confirmLabel="Delete"
        busy={deleting}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
