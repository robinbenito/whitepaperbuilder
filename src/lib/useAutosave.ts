import { useEffect, useRef, useState } from 'react';
import type { Submission } from '../types';
import { saveSubmission } from './persistence';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'quota' | 'error';

/**
 * Debounced autosave of the submission to localStorage. The first run is
 * skipped so we don't immediately re-persist whatever was just loaded.
 */
export function useAutosave(submission: Submission, delay = 600): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const isFirstRun = useRef(true);

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

  return status;
}
