import { supabase } from '@/lib/supabase';
import { sermonRecorderNative, type TranscriptionAudioPart } from '@/lib/sermonRecorderNative';
import { saveSermonTranscript, type SermonTranscript } from '@/lib/sermonRecordingStore';

const BUCKET = 'sermon-transcription-temp';
const PREVIOUS_TAIL_CHARS = 300;
const UPLOAD_RETRY_DELAYS_MS = [0, 2000, 5000];
const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const TRANSCRIPT_FAILURE_MESSAGE = "We couldn't finish the transcript. Your recording is safe on this device.";
const SIGN_IN_MESSAGE = 'Please sign in again to transcribe this sermon.';
const NO_SPEECH_MESSAGE = "We couldn't find any speech in this recording.";

export class TranscriptionError extends Error {}
export class TranscriptionCancelledError extends Error {}
export class NoSpeechError extends TranscriptionError {}

export type TranscriptionFailureStage =
  | 'native_prepare_failed'
  | 'upload_failed'
  | 'edge_function_failed'
  | 'provider_failed'
  | 'finalization_failed';

type FailureDetail = Record<string, number>;

export class TranscriptionStageError extends TranscriptionError {
  stage: TranscriptionFailureStage;
  detail: FailureDetail;

  constructor(stage: TranscriptionFailureStage, detail: FailureDetail = {}) {
    super(TRANSCRIPT_FAILURE_MESSAGE);
    this.stage = stage;
    this.detail = detail;
  }
}

export type TranscriptionProgress =
  | { stage: 'preparing' }
  | { stage: 'uploading'; partIndex: number; partCount: number }
  | { stage: 'transcribing'; partIndex: number; partCount: number }
  | { stage: 'finalizing' };

export interface TranscriptionJob {
  recordingId: string;
  jobId: string;
  token: string | null;
  parts: TranscriptionAudioPart[];
  texts: string[];
  cancelled: boolean;
}

export function createTranscriptionJob(recordingId: string): TranscriptionJob {
  return {
    recordingId,
    jobId: crypto.randomUUID(),
    token: null,
    parts: [],
    texts: [],
    cancelled: false,
  };
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function stitchTranscriptParts(parts: string[]): string {
  let result = '';
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    if (!result) {
      result = part;
      continue;
    }
    const resultWords = result.split(/\s+/);
    const partWords = part.split(/\s+/);
    const maxOverlap = Math.min(40, resultWords.length, partWords.length);
    let overlap = 0;
    for (let size = maxOverlap; size >= 3; size--) {
      const tail = resultWords.slice(-size).map(normalizeWord).join(' ');
      const head = partWords.slice(0, size).map(normalizeWord).join(' ');
      if (tail === head) {
        overlap = size;
        break;
      }
    }
    const remainder = partWords.slice(overlap).join(' ');
    if (remainder) result = `${result} ${remainder}`;
  }
  return result;
}

async function getSignedInUserId(): Promise<{ userId: string; accessToken: string }> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) throw new TranscriptionError(SIGN_IN_MESSAGE);
  return { userId: session.user.id, accessToken: session.access_token };
}

async function saveServerState(job: TranscriptionJob, userId: string, status: 'processing' | 'failed', failureCode: string | null = null) {
  const { error } = await supabase.from('sermon_transcripts').upsert(
    {
      user_id: userId,
      recording_id: job.recordingId,
      status,
      current_job_id: job.jobId,
      part_count: job.parts.length || null,
      failure_code: failureCode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,recording_id' },
  );
  if (error) throw new TranscriptionError(TRANSCRIPT_FAILURE_MESSAGE);
}

async function removeCloudAudio(userId: string, jobId: string) {
  const folder = `${userId}/${jobId}`;
  const { data, error } = await supabase.storage.from(BUCKET).list(folder);
  if (error) throw error;
  const paths = (data ?? []).map((file) => `${folder}/${file.name}`);
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) throw removeError;
  }
}

async function removeLocalParts(job: TranscriptionJob) {
  if (!job.token) return;
  try {
    await sermonRecorderNative.cleanupTranscriptionParts({ token: job.token });
  } catch (cause) {
    console.warn('Temporary local transcript parts could not be removed', cause);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadPart(job: TranscriptionJob, token: string, userId: string, accessToken: string, partIndex: number) {
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${userId}/${job.jobId}/part-${partIndex}.m4a`;
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await sermonRecorderNative.uploadTranscriptionPart({
        token,
        partIndex,
        uploadUrl,
        accessToken,
        apiKey: SUPABASE_ANON_KEY,
      });
      if (result?.success !== true) throw new TranscriptionStageError('upload_failed', { partIndex });
      return;
    } catch {
      assertActive(job);
      if (attempt >= UPLOAD_RETRY_DELAYS_MS.length) throw new TranscriptionStageError('upload_failed', { partIndex });
      await delay(UPLOAD_RETRY_DELAYS_MS[attempt]);
      assertActive(job);
    }
  }
}

function assertActive(job: TranscriptionJob) {
  if (job.cancelled) throw new TranscriptionCancelledError();
}

async function prepareParts(job: TranscriptionJob, fileName: string, userId: string, onProgress: (p: TranscriptionProgress) => void) {
  onProgress({ stage: 'preparing' });
  const prepared = await sermonRecorderNative.prepareTranscriptionParts({ fileName });
  job.token = prepared.token;
  job.parts = prepared.parts;
  job.texts = [];
  await saveServerState(job, userId, 'processing');
}

async function uploadPendingParts(job: TranscriptionJob, userId: string, accessToken: string, onProgress: (p: TranscriptionProgress) => void) {
  const token = job.token;
  if (!token) throw new TranscriptionStageError('upload_failed');
  const partCount = job.parts.length;
  const pending = job.parts.map((_, index) => index).filter((index) => job.texts[index] === undefined);

  for (const index of pending) {
    assertActive(job);
    onProgress({ stage: 'uploading', partIndex: index + 1, partCount });
    await uploadPart(job, token, userId, accessToken, index);
    await saveServerState(job, userId, 'processing');
  }
}

async function functionStageError(error: unknown, partIndex: number): Promise<TranscriptionStageError> {
  const response = (error as { context?: unknown } | null)?.context;
  if (!(response instanceof Response)) return new TranscriptionStageError('edge_function_failed', { partIndex });
  const body: unknown = await response.clone().json().catch(() => null);
  const code = typeof body === 'object' && body !== null && 'error' in body ? body.error : null;
  const stage = typeof code === 'string' && code.startsWith('provider_') ? 'provider_failed' : 'edge_function_failed';
  return new TranscriptionStageError(stage, { partIndex, httpStatus: response.status });
}

async function transcribeParts(job: TranscriptionJob, userId: string, onProgress: (p: TranscriptionProgress) => void) {
  const partCount = job.parts.length;
  for (let index = 0; index < partCount; index++) {
    if (job.texts[index] !== undefined) continue;
    assertActive(job);
    onProgress({ stage: 'transcribing', partIndex: index + 1, partCount });
    const previousTail = stitchTranscriptParts(job.texts.slice(0, index)).slice(-PREVIOUS_TAIL_CHARS);
    const { data, error } = await supabase.functions.invoke<{ partIndex: number; text: string }>('transcribe-sermon-part', {
      body: {
        recordingId: job.recordingId,
        jobId: job.jobId,
        partIndex: index,
        partCount,
        storagePath: `${userId}/${job.jobId}/part-${index}.m4a`,
        previousTail,
      },
    });
    if (error) throw await functionStageError(error, index);
    if (typeof data?.text !== 'string') throw new TranscriptionStageError('edge_function_failed', { partIndex: index });
    job.texts[index] = data.text;
    await saveServerState(job, userId, 'processing');
  }
}

async function finalizeJob(job: TranscriptionJob, userId: string): Promise<SermonTranscript> {
  assertActive(job);
  const text = stitchTranscriptParts(job.texts);
  if (!text) throw new NoSpeechError(NO_SPEECH_MESSAGE);
  const transcript: SermonTranscript = {
    recordingId: job.recordingId,
    text,
    createdAt: new Date().toISOString(),
  };
  await saveSermonTranscript(transcript);

  const { error: partsError } = await supabase.from('sermon_transcript_parts').delete().eq('job_id', job.jobId);
  if (partsError) console.warn('Transcript part rows could not be removed', partsError.message);
  const { error: rowError } = await supabase.from('sermon_transcripts').delete().eq('recording_id', job.recordingId);
  if (rowError) console.warn('Transcript job row could not be removed', rowError.message);
  try {
    await removeCloudAudio(userId, job.jobId);
  } catch (cause) {
    console.warn('Temporary cloud audio could not be removed', cause);
  }
  await removeLocalParts(job);
  return transcript;
}

function failureCodeFor(cause: unknown, phase: TranscriptionFailureStage): string {
  if (cause instanceof NoSpeechError) return 'no_speech';
  if (cause instanceof TranscriptionStageError) return cause.stage;
  return phase;
}

function logFailure(job: TranscriptionJob, failureCode: string, cause: unknown) {
  const detail = cause instanceof TranscriptionStageError ? cause.detail : {};
  console.warn('Transcription failed', {
    jobId: job.jobId,
    stage: failureCode,
    partCount: job.parts.length,
    errorName: cause instanceof Error ? cause.name : typeof cause,
    ...detail,
  });
}

export async function runTranscriptionJob(
  job: TranscriptionJob,
  fileName: string,
  onProgress: (p: TranscriptionProgress) => void,
): Promise<SermonTranscript> {
  const { userId, accessToken } = await getSignedInUserId();
  let phase: TranscriptionFailureStage = 'native_prepare_failed';
  try {
    await saveServerState(job, userId, 'processing');
    if (job.parts.length === 0) await prepareParts(job, fileName, userId, onProgress);
    phase = 'upload_failed';
    await uploadPendingParts(job, userId, accessToken, onProgress);
    phase = 'edge_function_failed';
    await transcribeParts(job, userId, onProgress);
    phase = 'finalization_failed';
    onProgress({ stage: 'finalizing' });
    return await finalizeJob(job, userId);
  } catch (cause) {
    if (job.cancelled || cause instanceof TranscriptionCancelledError) throw new TranscriptionCancelledError();
    const failureCode = failureCodeFor(cause, phase);
    logFailure(job, failureCode, cause);
    await failJob(job, userId, failureCode).catch(() => undefined);
    if (cause instanceof TranscriptionError) throw cause;
    throw new TranscriptionError(TRANSCRIPT_FAILURE_MESSAGE);
  }
}

async function failJob(job: TranscriptionJob, userId: string, failureCode: string) {
  try {
    await removeCloudAudio(userId, job.jobId);
  } catch (cause) {
    console.warn('Temporary cloud audio could not be removed after failure', cause);
  }
  await saveServerState(job, userId, 'failed', failureCode);
}

export async function cancelTranscriptionJob(job: TranscriptionJob) {
  job.cancelled = true;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (userId) {
    try {
      await removeCloudAudio(userId, job.jobId);
    } catch (cause) {
      console.warn('Temporary cloud audio could not be removed after cancel', cause);
    }
    await supabase.from('sermon_transcript_parts').delete().eq('job_id', job.jobId);
    await supabase.from('sermon_transcripts').delete().eq('recording_id', job.recordingId);
  }
  await removeLocalParts(job);
}

export function hasTranscriptionConsent(profileId: string): boolean {
  return localStorage.getItem(consentKey(profileId)) === 'granted';
}

export function grantTranscriptionConsent(profileId: string) {
  localStorage.setItem(consentKey(profileId), 'granted');
}

function consentKey(profileId: string) {
  return `solapath.transcriptionConsent.${profileId}`;
}

export async function discardServerTranscript(recordingId: string) {
  const { error } = await supabase.from('sermon_transcripts').delete().eq('recording_id', recordingId);
  if (error) console.warn('Transcript job row could not be removed', error.message);
}
