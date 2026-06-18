import { useState } from 'react';
import type { Submission } from '../types';
import { synthesizeNotes } from '../lib/synthesize';

interface Props {
  onApply: (patch: Partial<Submission>) => void;
}

/**
 * "Synthesize" panel: the student describes their work in plain, conversational
 * language and an AI model reformulates it into a structured title / abstract /
 * synthesis. Sits beneath the main synthesis input.
 */
export default function SynthesizePanel({ onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [rough, setRough] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (rough.trim().length < 10) {
      setError('Write a few sentences about your work first.');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const result = await synthesizeNotes(rough.trim());
      onApply({
        title: result.title,
        abstract: result.abstract,
        synthesis: result.synthesis,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Synthesis failed.');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold text-violet-800"
      >
        <span className="flex items-center gap-1.5">✦ Synthesize from rough notes</span>
        <span className="text-violet-500">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-violet-700/80">
            Describe your paper, your progress, and what you learned in plain language. The AI
            rewrites it into a structured title, abstract, and synthesis. (Replaces those fields.)
          </p>
          <textarea
            value={rough}
            onChange={(e) => setRough(e.target.value)}
            rows={6}
            placeholder="e.g. I explored how lighting words change portraits. Started with plain prompts, then added 'golden hour', 'rim light'… the biggest surprise was how 'cinematic' shifted the whole composition…"
            className="w-full rounded-md border border-violet-300 px-2 py-1.5 text-xs focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={run}
              disabled={status === 'loading' || !rough.trim()}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Synthesizing…' : 'Synthesize'}
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
