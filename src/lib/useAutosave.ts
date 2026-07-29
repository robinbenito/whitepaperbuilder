import { useEffect, useRef, useState } from 'react';
import type { Submission } from '../types';
import { saveSubmission } from './persistence';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'quota' | 'error';

/**
 * Debounced autosave of the submission to IndexedDB.
 *
 * - The first run is skipped so we don't immediately re-persist whatever was
 *   just loaded.
 * - The latest submission is also flushed when the tab is hidden or unloaded,
 *   so a reload within the debounce window can't lose the last edit.
 */
export function useAutosave(submission: Submission, delay = 600): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const isFirstRun = useRef(true);
  // Hold the newest submission so the unload flush always saves current state.
  const latest = useRef(submission);
  latest.current = submission;
  // Saves resolve asynchronously; only the newest edit's save may report status.
  const saveSeq = useRef(0);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setStatus('saving');
    const seq = ++saveSeq.current;
    const timer = setTimeout(() => {
      void saveSubmission(submission).then((result) => {
        if (seq === saveSeq.current) setStatus(result === 'ok' ? 'saved' : result);
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [submission, delay]);

  // Flush immediately when the page is being hidden/unloaded — covers a quick
  // reload or tab close before the debounce timer has fired. The write is
  // best-effort: an IndexedDB transaction started here normally commits even
  // as the page goes away.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') void saveSubmission(latest.current);
    };
    const flushNow = () => void saveSubmission(latest.current);
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flushNow);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flushNow);
    };
  }, []);

  return status;
}
