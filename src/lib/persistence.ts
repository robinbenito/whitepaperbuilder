// Client-side persistence for the in-progress submission.
//
// Privacy by design (DSGVO/GDPR): the draft never leaves the browser. We store
// it in localStorage on the user's own device — no server, no account, and no
// IP/fingerprint linkage — so a user can close the tab and return later to keep
// iterating without us processing any personal data on a backend.

import type { Submission } from '../types';
import { emptySubmission } from '../types';

const KEY = 'whitepaperbuilder:submission:v1';

export type SaveResult = 'ok' | 'quota' | 'error';

/** Returns a stored draft if one exists and looks structurally valid, else null. */
export function loadSubmission(): Submission | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.entries) &&
      Array.isArray(parsed.groups)
    ) {
      // Merge over a fresh template so older drafts missing newer fields stay valid.
      return { ...emptySubmission(), ...(parsed as Partial<Submission>) };
    }
  } catch {
    // Corrupt JSON or localStorage unavailable (private mode / blocked) — start fresh.
  }
  return null;
}

export function saveSubmission(submission: Submission): SaveResult {
  try {
    localStorage.setItem(KEY, JSON.stringify(submission));
    return 'ok';
  } catch (e) {
    // Base64 images can blow past the ~5 MB localStorage budget.
    if (
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      return 'quota';
    }
    return 'error';
  }
}

export function clearSubmission(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore — nothing we can do if storage is unavailable.
  }
}
