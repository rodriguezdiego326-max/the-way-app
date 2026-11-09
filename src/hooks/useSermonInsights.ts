import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSermonInsights, saveSermonInsights, deleteSermonInsights, getSermonTranscript,
  type SermonInsightsRecord, type SermonRecordingMeta, type SermonTranscript,
} from '@/lib/sermonRecordingStore';
import {
  hasSermonInsightsConsent, grantSermonInsightsConsent, requestSermonInsights, transcriptFingerprint,
  SERMON_INSIGHTS_FAILURE_MESSAGE, SermonInsightsError,
} from '@/lib/sermonInsights';

export type InsightsStage = 'reading' | 'creating' | 'finalizing';

export function useSermonInsights(meta: SermonRecordingMeta | null, transcript: SermonTranscript | null) {
  const [record, setRecord] = useState<SermonInsightsRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stage, setStage] = useState<InsightsStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const inFlightRef = useRef(false);
  const metaId = meta?.id ?? null;
  const profileId = meta?.profileId ?? null;
  const transcriptText = transcript?.text ?? null;

  useEffect(() => {
    if (!metaId || !profileId) return;
    let cancelled = false;
    setConsented(hasSermonInsightsConsent(profileId));
    setError(null);
    (async () => {
      const stored = await getSermonInsights(metaId);
      if (!transcriptText) {
        if (stored) await deleteSermonInsights(metaId);
        return null;
      }
      const fingerprint = await transcriptFingerprint(transcriptText);
      if (stored && stored.transcriptFingerprint !== fingerprint) {
        await deleteSermonInsights(metaId);
        return null;
      }
      return stored;
    })()
      .then((current) => { if (!cancelled) setRecord(current); })
      .catch(() => { if (!cancelled) setRecord(null); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [metaId, profileId, transcriptText]);

  const grantConsent = useCallback(() => {
    if (!profileId) return;
    grantSermonInsightsConsent(profileId);
    setConsented(true);
  }, [profileId]);

  const generate = useCallback(async (): Promise<boolean> => {
    if (!meta || !transcript || inFlightRef.current) return false;
    inFlightRef.current = true;
    setError(null);
    setStage('reading');
    try {
      const fingerprint = await transcriptFingerprint(transcript.text);
      setStage('creating');
      const insights = await requestSermonInsights({
        transcript: transcript.text,
        title: meta.title,
        preacher: meta.preacher,
        serviceName: meta.serviceName,
      });
      setStage('finalizing');
      const current = await getSermonTranscript(meta.id);
      if (!current || current.text !== transcript.text) {
        throw new SermonInsightsError(SERMON_INSIGHTS_FAILURE_MESSAGE);
      }
      const next: SermonInsightsRecord = {
        recordingId: meta.id,
        transcriptFingerprint: fingerprint,
        insights,
        createdAt: new Date().toISOString(),
      };
      await saveSermonInsights(next);
      setRecord(next);
      return true;
    } catch (cause) {
      setError(cause instanceof SermonInsightsError ? cause.message : SERMON_INSIGHTS_FAILURE_MESSAGE);
      return false;
    } finally {
      inFlightRef.current = false;
      setStage(null);
    }
  }, [meta, transcript]);

  return {
    record,
    loaded,
    stage,
    error,
    isGenerating: stage !== null,
    consented,
    grantConsent,
    generate,
    clearError: () => setError(null),
  };
}

export type SermonInsightsState = ReturnType<typeof useSermonInsights>;
