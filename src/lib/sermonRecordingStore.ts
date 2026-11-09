const DB_NAME = 'solapath-sermon-assistant';
const DB_VERSION = 3;
const META_STORE = 'recordings';
const LEGACY_AUDIO_STORE = 'audio';
const TRANSCRIPT_STORE = 'transcripts';
const INSIGHTS_STORE = 'insights';

export interface SermonRecordingMeta {
  id: string;
  profileId: string;
  title: string | null;
  preacher: string | null;
  serviceName: string | null;
  startedAt: string;
  createdAt: string;
  durationMs: number;
  fileName: string | null;
}

export interface SermonRecordingDetails {
  title: string | null;
  preacher: string | null;
  serviceName: string | null;
}

export interface SermonTranscript {
  recordingId: string;
  text: string;
  createdAt: string;
}

export interface SermonInsights {
  summary: string;
  mainPoints: { title: string; summary: string }[];
  scriptureReferences: { reference: string; context: string; confidence: 'explicit' | 'likely' }[];
  applicationTakeaways: string[];
  reflectionQuestions: string[];
  limitations: string[];
  generatedAt: string;
  modelVersion: string;
}

export interface SermonInsightsRecord {
  recordingId: string;
  transcriptFingerprint: string;
  insights: SermonInsights;
  createdAt: string;
}

export interface NewSermonRecording {
  profileId: string;
  fileName: string;
  durationMs: number;
  startedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(META_STORE)) {
          const meta = db.createObjectStore(META_STORE, { keyPath: 'id' });
          meta.createIndex('profileId', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains(LEGACY_AUDIO_STORE)) {
          db.createObjectStore(LEGACY_AUDIO_STORE);
        }
        if (!db.objectStoreNames.contains(TRANSCRIPT_STORE)) {
          db.createObjectStore(TRANSCRIPT_STORE, { keyPath: 'recordingId' });
        }
        if (!db.objectStoreNames.contains(INSIGHTS_STORE)) {
          db.createObjectStore(INSIGHTS_STORE, { keyPath: 'recordingId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function saveSermonRecording(input: NewSermonRecording): Promise<SermonRecordingMeta> {
  const db = await openDb();
  const meta: SermonRecordingMeta = {
    id: crypto.randomUUID(),
    profileId: input.profileId,
    title: null,
    preacher: null,
    serviceName: null,
    startedAt: input.startedAt,
    createdAt: new Date().toISOString(),
    durationMs: input.durationMs,
    fileName: input.fileName,
  };
  const tx = db.transaction(META_STORE, 'readwrite');
  tx.objectStore(META_STORE).put(meta);
  await transactionDone(tx);
  return meta;
}

export async function listSermonRecordings(profileId: string): Promise<SermonRecordingMeta[]> {
  const db = await openDb();
  const tx = db.transaction(META_STORE, 'readonly');
  const rows = await requestToPromise<SermonRecordingMeta[]>(
    tx.objectStore(META_STORE).index('profileId').getAll(profileId),
  );
  return rows.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function getSermonRecording(
  id: string,
): Promise<{ meta: SermonRecordingMeta; legacyBlob: Blob | null } | null> {
  const db = await openDb();
  const tx = db.transaction([META_STORE, LEGACY_AUDIO_STORE], 'readonly');
  const meta = await requestToPromise<SermonRecordingMeta | undefined>(tx.objectStore(META_STORE).get(id));
  if (!meta) return null;
  const legacyBlob = meta.fileName
    ? null
    : (await requestToPromise<Blob | undefined>(tx.objectStore(LEGACY_AUDIO_STORE).get(id))) ?? null;
  return { meta, legacyBlob };
}

export async function updateSermonRecordingDetails(id: string, details: SermonRecordingDetails): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(META_STORE, 'readwrite');
  const store = tx.objectStore(META_STORE);
  const existing = await requestToPromise<SermonRecordingMeta | undefined>(store.get(id));
  if (!existing) throw new Error('Recording not found');
  store.put({ ...existing, ...details });
  await transactionDone(tx);
}

export async function deleteSermonRecordingMeta(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([META_STORE, LEGACY_AUDIO_STORE, TRANSCRIPT_STORE, INSIGHTS_STORE], 'readwrite');
  tx.objectStore(META_STORE).delete(id);
  tx.objectStore(LEGACY_AUDIO_STORE).delete(id);
  tx.objectStore(TRANSCRIPT_STORE).delete(id);
  tx.objectStore(INSIGHTS_STORE).delete(id);
  await transactionDone(tx);
}

export async function getSermonTranscript(recordingId: string): Promise<SermonTranscript | null> {
  const db = await openDb();
  const tx = db.transaction(TRANSCRIPT_STORE, 'readonly');
  const row = await requestToPromise<SermonTranscript | undefined>(tx.objectStore(TRANSCRIPT_STORE).get(recordingId));
  return row ?? null;
}

export async function saveSermonTranscript(transcript: SermonTranscript): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([TRANSCRIPT_STORE, INSIGHTS_STORE], 'readwrite');
  tx.objectStore(TRANSCRIPT_STORE).put(transcript);
  tx.objectStore(INSIGHTS_STORE).delete(transcript.recordingId);
  await transactionDone(tx);
}

export async function deleteSermonTranscript(recordingId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([TRANSCRIPT_STORE, INSIGHTS_STORE], 'readwrite');
  tx.objectStore(TRANSCRIPT_STORE).delete(recordingId);
  tx.objectStore(INSIGHTS_STORE).delete(recordingId);
  await transactionDone(tx);
}

export async function getSermonInsights(recordingId: string): Promise<SermonInsightsRecord | null> {
  const db = await openDb();
  const tx = db.transaction(INSIGHTS_STORE, 'readonly');
  const row = await requestToPromise<SermonInsightsRecord | undefined>(tx.objectStore(INSIGHTS_STORE).get(recordingId));
  return row ?? null;
}

export async function saveSermonInsights(record: SermonInsightsRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(INSIGHTS_STORE, 'readwrite');
  tx.objectStore(INSIGHTS_STORE).put(record);
  await transactionDone(tx);
}

export async function deleteSermonInsights(recordingId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(INSIGHTS_STORE, 'readwrite');
  tx.objectStore(INSIGHTS_STORE).delete(recordingId);
  await transactionDone(tx);
}
