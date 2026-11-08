const DB_NAME = 'solapath-sermon-assistant';
const DB_VERSION = 1;
const META_STORE = 'recordings';
const AUDIO_STORE = 'audio';

export interface SermonRecordingMeta {
  id: string;
  profileId: string;
  title: string | null;
  preacher: string | null;
  serviceName: string | null;
  startedAt: string;
  createdAt: string;
  durationMs: number;
  mimeType: string;
}

export interface SermonRecordingDetails {
  title: string | null;
  preacher: string | null;
  serviceName: string | null;
}

export interface NewSermonRecording {
  profileId: string;
  blob: Blob;
  mimeType: string;
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
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          db.createObjectStore(AUDIO_STORE);
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
    mimeType: input.mimeType,
  };
  const tx = db.transaction([META_STORE, AUDIO_STORE], 'readwrite');
  tx.objectStore(META_STORE).put(meta);
  tx.objectStore(AUDIO_STORE).put(input.blob, meta.id);
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
): Promise<{ meta: SermonRecordingMeta; blob: Blob } | null> {
  const db = await openDb();
  const tx = db.transaction([META_STORE, AUDIO_STORE], 'readonly');
  const meta = await requestToPromise<SermonRecordingMeta | undefined>(tx.objectStore(META_STORE).get(id));
  if (!meta) return null;
  const blob = await requestToPromise<Blob | undefined>(tx.objectStore(AUDIO_STORE).get(id));
  if (!blob) return null;
  return { meta, blob };
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

export async function deleteSermonRecording(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([META_STORE, AUDIO_STORE], 'readwrite');
  tx.objectStore(META_STORE).delete(id);
  tx.objectStore(AUDIO_STORE).delete(id);
  await transactionDone(tx);
}
