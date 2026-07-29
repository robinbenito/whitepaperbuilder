// Client-side persistence for the in-progress submission.
//
// Privacy by design (DSGVO/GDPR): the draft never leaves the browser. We store
// it in IndexedDB on the user's own device — no server, no account, and no
// IP/fingerprint linkage — so a user can close the tab and return later to keep
// iterating without us processing any personal data on a backend.
//
// IndexedDB rather than localStorage because drafts embed base64 images and
// easily exceed localStorage's ~5 MB quota. IndexedDB quotas are measured in
// hundreds of MB or more, so image-heavy drafts save without hitting a limit.

import type { Submission } from '../types';
import { emptySubmission } from '../types';

const DB_NAME = 'whitepaperbuilder';
const STORE = 'drafts';
const DRAFT_KEY = 'submission:v1';
// Drafts lived in localStorage before moving to IndexedDB; still read (and
// migrated) on load, and written as a fallback when IndexedDB is unavailable.
const LEGACY_KEY = 'whitepaperbuilder:submission:v1';

export type SaveResult = 'ok' | 'quota' | 'error';

// One connection is shared across operations so the pagehide flush can start
// its write without waiting for a fresh open.
let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => {
        const db = request.result;
        // If the browser closes the connection (or another tab upgrades the
        // schema), drop the cache so the next operation reopens it.
        db.onclose = () => {
          dbPromise = null;
        };
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    }).catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

async function idbGet(): Promise<unknown> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(DRAFT_KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbWrite(fn: (store: IDBObjectStore) => void): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Accepts a structurally valid stored draft, merged over a fresh template so
 * older drafts missing newer fields stay valid. */
function parseSubmission(value: unknown): Submission | null {
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as Submission).entries) &&
    Array.isArray((value as Submission).groups)
  ) {
    return { ...emptySubmission(), ...(value as Partial<Submission>) };
  }
  return null;
}

function loadLegacy(): Submission | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    return raw ? parseSubmission(JSON.parse(raw)) : null;
  } catch {
    // Corrupt JSON or localStorage unavailable (private mode / blocked) — start fresh.
    return null;
  }
}

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/** Returns a stored draft if one exists and looks structurally valid, else null. */
export async function loadSubmission(): Promise<Submission | null> {
  try {
    const draft = parseSubmission(await idbGet());
    if (draft) return draft;
  } catch {
    // IndexedDB unavailable (blocked or broken) — fall through to legacy storage.
  }
  const legacy = loadLegacy();
  if (legacy) {
    // Migrate the pre-IndexedDB draft; drop the localStorage copy only once it
    // is safely stored so a failed migration can't lose it.
    try {
      await idbWrite((store) => store.put(legacy, DRAFT_KEY));
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Keep the legacy copy; the next save will retry or fall back.
    }
  }
  return legacy;
}

export async function saveSubmission(submission: Submission): Promise<SaveResult> {
  try {
    await idbWrite((store) => store.put(submission, DRAFT_KEY));
    return 'ok';
  } catch (e) {
    // Only a genuinely full disk trips this now; a full disk would sink the
    // localStorage fallback too, so report it straight away.
    if (isQuotaError(e)) return 'quota';
  }
  // IndexedDB unavailable — keep the old localStorage path working (with its
  // smaller quota) rather than not saving at all.
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(submission));
    return 'ok';
  } catch (e) {
    return isQuotaError(e) ? 'quota' : 'error';
  }
}

export async function clearSubmission(): Promise<void> {
  try {
    await idbWrite((store) => store.delete(DRAFT_KEY));
  } catch {
    // Ignore — nothing we can do if storage is unavailable.
  }
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Ignore.
  }
}
