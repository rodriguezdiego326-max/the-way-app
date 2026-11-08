import { Capacitor } from '@capacitor/core';
import { Upload } from 'tus-js-client';
import { supabase } from '@/lib/supabase';
import { sermonRecorderNative, type TranscriptionAudioPart } from '@/lib/sermonRecorderNative';
import { saveSermonTranscript, type SermonTranscript } from '@/lib/sermonRecordingStore';

const BUCKET = 'sermon-transcription-temp';
const PREVIOUS_TAIL_CHARS = 300;
const SMALL_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;
const RESUMABLE_CHUNK_BYTES = 6 * 1024 * 1024;
const RESUMABLE_RETRY_DELAYS = [0, 1000, 3000, 5000, 10000];
const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const TRANSCRIPT_FAILURE_MESSAGE = "We couldn't finish the transcript. Your recording is safe on this device.";
const SIGN_IN_MESSAGE = 'Please sign in again to transcribe this sermon.';
const NO_SPEECH_MESSAGE = "We couldn't find any speech in this recording.";

export class TranscriptionError extends Error {}
export class TranscriptionCancelledError extends Error {}

export type TranscriptionProgress =
  | { stage: 'preparing' }
  | { stage: 'uploading'; percent: number }
  | { stage: 'transcribing'; partIndex: number; partCount: number }
  | { stage: 'finalizing' };

export interface TranscriptionJob {
  recordingId: string;
  jobId: string;
  token: string | null;
  parts: TranscriptionAudioPart[];
  texts: string[];
  cancelled: boolean;
  abortUpload: (() => void) | null;
}

export function createTranscriptionJob(recordingId: string): TranscriptionJob {
  return {
    recordingId,
    jobId: crypto.randomUUID(),
    token: null,
    parts: [],
    texts: [],
    cancelled: false,
    abortUpload: null,
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

function resumableUploadEndpoint(): string {
  const projectHost = new URL(SUPABASE_URL).hostname.replace(/\.supabase\.co$/, '');
  return `https://${projectHost}.storage.supabase.co/storage/v1/upload/resumable`;
}

async function uploadPart(job: TranscriptionJob, path: string, blob: Blob, accessToken: string, onBytes: (loaded: number) => void) {
  if (blob.size > SMALL_UPLOAD_MAX_BYTES) {
    await uploadResumablePart(job, path, blob, accessToken, onBytes);
    return;
  }
  await uploadStandardPart(job, path, blob, accessToken, onBytes);
}

function uploadResumablePart(job: TranscriptionJob, path: string, blob: Blob, accessToken: string, onBytes: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const upload = new Upload(blob, {
      endpoint: resumableUploadEndpoint(),
      chunkSize: RESUMABLE_CHUNK_BYTES,
      retryDelays: RESUMABLE_RETRY_DELAYS,
      removeFingerprintOnSuccess: true,
      fingerprint: async () => `sermon-transcription:${path}:${blob.size}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      metadata: {
        bucketName: BUCKET,
        objectName: path,
        contentType: 'audio/mp4',
        cacheControl: '3600',
      },
      onProgress: (bytesSent) => onBytes(bytesSent),
      onSuccess: () => {
        job.abortUpload = null;
        resolve();
      },
      onError: () => {
        job.abortUpload = null;
        reject(new TranscriptionError(TRANSCRIPT_FAILURE_MESSAGE));
      },
    });
    job.abortUpload = () => {
      job.abortUpload = null;
      upload.abort(true).catch(() => undefined);
      reject(new TranscriptionCancelledError());
    };
    upload
      .findPreviousUploads()
      .catch(() => [])
      .then((previous) => {
        if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
        upload.start();
      });
  });
}

function uploadStandardPart(job: TranscriptionJob, path: string, blob: Blob, accessToken: string, onBytes: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    job.abortUpload = () => xhr.abort();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader('Content-Type', 'audio/mp4');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onBytes(event.loaded);
    };
    xhr.onload = () => {
      job.abortUpload = null;
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new TranscriptionError(TRANSCRIPT_FAILURE_MESSAGE));
    };
    xhr.onerror = () => {
      job.abortUpload = null;
      reject(new TranscriptionError(TRANSCRIPT_FAILURE_MESSAGE));
    };
    xhr.onabort = () => {
      job.abortUpload = null;
      reject(new TranscriptionCancelledError());
    };
    xhr.send(blob);
  });
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
  const pending = job.parts.map((part, index) => ({ part, index })).filter(({ index }) => job.texts[index] === undefined);
  const totalBytes = pending.reduce((sum, { part }) => sum + part.sizeBytes, 0);
  let completedBytes = 0;
  onProgress({ stage: 'uploading', percent: 0 });

  for (const { part, index } of pending) {
    assertActive(job);
    const response = await fetch(Capacitor.convertFileSrc(part.absolutePath));
    if (!response.ok) throw new TranscriptionError(TRANSCRIPT_FAILURE_MESSAGE);
    const blob = await response.blob();
    const path = `${userId}/${job.jobId}/part-${index}.m4a`;
    const bytesBefore = completedBytes;
    await uploadPart(job, path, blob, accessToken, (loaded) => {
      const percent = totalBytes > 0 ? Math.floor(((bytesBefore + loaded) / totalBytes) * 100) : 100;
      onProgress({ stage: 'uploading', percent: Math.min(percent, 99) });
    });
    completedBytes += part.sizeBytes;
    await saveServerState(job, userId, 'processing');
  }
  if (pending.length > 0) onProgress({ stage: 'uploading', percent: 100 });
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
    if (error || typeof data?.text !== 'string') throw new TranscriptionError(TRANSCRIPT_FAILURE_MESSAGE);
    job.texts[index] = data.text;
    await saveServerState(job, userId, 'processing');
  }
}

async function finalizeJob(job: TranscriptionJob, userId: string): Promise<SermonTranscript> {
  assertActive(job);
  const text = stitchTranscriptParts(job.texts);
  if (!text) throw new TranscriptionError(NO_SPEECH_MESSAGE);
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

export async function runTranscriptionJob(
  job: TranscriptionJob,
  fileName: string,
  onProgress: (p: TranscriptionProgress) => void,
): Promise<SermonTranscript> {
  const { userId, accessToken } = await getSignedInUserId();
  try {
    await saveServerState(job, userId, 'processing');
    if (job.parts.length === 0) await prepareParts(job, fileName, userId, onProgress);
    await uploadPendingParts(job, userId, accessToken, onProgress);
    await transcribeParts(job, userId, onProgress);
    onProgress({ stage: 'finalizing' });
    return await finalizeJob(job, userId);
  } catch (cause) {
    if (job.cancelled || cause instanceof TranscriptionCancelledError) throw new TranscriptionCancelledError();
    await failJob(job, userId).catch(() => undefined);
    if (cause instanceof TranscriptionError) throw cause;
    console.error('Transcription failed', cause);
    throw new TranscriptionError(TRANSCRIPT_FAILURE_MESSAGE);
  }
}

async function failJob(job: TranscriptionJob, userId: string) {
  try {
    await removeCloudAudio(userId, job.jobId);
  } catch (cause) {
    console.warn('Temporary cloud audio could not be removed after failure', cause);
  }
  await saveServerState(job, userId, 'failed', 'processing_failed');
}

export async function cancelTranscriptionJob(job: TranscriptionJob) {
  job.cancelled = true;
  job.abortUpload?.();
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
