import type { Submission, ImageEntry } from '../types';
import { emptyEntry } from '../types';
import ImageEntryEditor from './ImageEntryEditor';

interface Props {
  submission: Submission;
  onChange: (patch: Partial<Submission>) => void;
}

export default function SubmissionForm({ submission, onChange }: Props) {
  function patchEntry(id: string, patch: Partial<ImageEntry>) {
    onChange({
      entries: submission.entries.map((en) => (en.id === id ? { ...en, ...patch } : en)),
    });
  }
  function addEntry() {
    onChange({ entries: [...submission.entries, emptyEntry()] });
  }
  function removeEntry(id: string) {
    onChange({ entries: submission.entries.filter((en) => en.id !== id) });
  }

  const field = 'w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400';
  const label = 'mb-1 block text-xs font-medium text-slate-600';

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Title block
        </h2>
        <div>
          <label className={label}>Paper title</label>
          <input
            value={submission.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className={field}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Student name</label>
            <input
              value={submission.studentName}
              onChange={(e) => onChange({ studentName: e.target.value })}
              placeholder="Ada Lovelace"
              className={field}
            />
          </div>
          <div>
            <label className={label}>Course</label>
            <input
              value={submission.course}
              onChange={(e) => onChange({ course: e.target.value })}
              className={field}
            />
          </div>
        </div>
        <div>
          <label className={label}>Date</label>
          <input
            type="date"
            value={submission.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={field}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Abstract</h2>
        <textarea
          value={submission.abstract}
          onChange={(e) => onChange({ abstract: e.target.value })}
          rows={4}
          className={field}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Synthesis <span className="font-normal lowercase text-slate-400">(Markdown)</span>
        </h2>
        <textarea
          value={submission.synthesis}
          onChange={(e) => onChange({ synthesis: e.target.value })}
          rows={14}
          className={`${field} font-mono text-xs leading-relaxed`}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Image documentation
          </h2>
          <button
            type="button"
            onClick={addEntry}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            + Add figure
          </button>
        </div>
        <div className="space-y-4">
          {submission.entries.map((entry, i) => (
            <ImageEntryEditor
              key={entry.id}
              entry={entry}
              index={i}
              onChange={(patch) => patchEntry(entry.id, patch)}
              onRemove={() => removeEntry(entry.id)}
              canRemove={submission.entries.length > 1}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
