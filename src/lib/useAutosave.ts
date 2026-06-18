import { useEffect, useRef, useState } from 'react';
import type { Submission } from '../types';
import { saveSubmission } from './persistence';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'quota' | 'error';

/**
 * Debounced autosave of the submission to localStorage.
 *
 * - The first run is skipped so we don't immediately re-persist whatever was
 *   just loaded.
 * - The latest submission is also flushed synchronously when the tab is hidden
 *   or unloaded, so a reload within the debounce window can't lose the last
 *   edit.
 */
export function useAutosave(submission: Submission, delay = 600): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const isFirstRun = useRef(true);
  // Hold the newest submission so the unload flush always saves current state.
  const latest = useRef(submission);
  latest.current = submission;

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setStatus('saving');
    const timer = setTimeout(() => {
      const result = saveSubmission(submission);
      setStatus(result === 'ok' ? 'saved' : result);
    }, delay);
    return () => clearTimeout(timer);
  }, [submission, delay]);

  // Flush immediately when the page is being hidden/unloaded — covers a quick
  // reload or tab close before the debounce timer has fired.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') saveSubmission(latest.current);
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', () => saveSubmission(latest.current));
    return () => {
      document.removeEventListener('visibilitychange', flush);
    };
  }, []);

  return status;
}
