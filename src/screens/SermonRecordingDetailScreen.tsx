import { useEffect, useState } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';
import { vibrate, formatDate, formatDuration } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import SermonPlaybackPanel from '@/components/sermon/SermonPlaybackPanel';
import { sermonRecorderNative } from '@/lib/sermonRecorderNative';
import {
  getSermonRecording, updateSermonRecordingDetails, deleteSermonRecordingMeta,
  type SermonRecordingMeta,
} from '@/lib/sermonRecordingStore';

interface Props {
  recordingId: string;
  fresh: boolean;
  interrupted: boolean;
  onDone: () => void;
}

export default function SermonRecordingDetailScreen({ recordingId, fresh, interrupted, onDone }: Props) {
  const [meta, setMeta] = useState<SermonRecordingMeta | null>(null);
  const [legacyBlob, setLegacyBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [preacher, setPreacher] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      if (meta.fileName) {
        await sermonRecorderNative.deleteRecording({ fileName: meta.fileName });
      }
      await deleteSermonRecordingMeta(meta.id);
      onDone();
    } catch {
      setDeleteError('This recording could not be deleted. Please try again.');
      setDeleting(false);
    }
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
                <p className="text-ivory-600 text-xs leading-relaxed mt-4">
                  Transcription and sermon insights will be available in a future update.
                </p>
              </div>

              <SermonPlaybackPanel meta={meta} legacyBlob={legacyBlob} />

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

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setConfirmDeleteOpen(false)}>
          <div className="w-full max-w-md bg-ink-900 rounded-t-3xl p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-ivory-50 mb-2">Delete this recording?</h3>
            <p className="text-ivory-400 text-sm leading-relaxed mb-6">This permanently deletes the audio from this device.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDelete} disabled={deleting} className="btn-primary w-full disabled:opacity-40">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setConfirmDeleteOpen(false)} disabled={deleting} className="btn-secondary w-full disabled:opacity-40">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
