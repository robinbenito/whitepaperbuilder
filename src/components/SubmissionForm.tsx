import { useRef, useState } from 'react';
import type { Submission, ImageEntry, ImportGroup } from '../types';
import { emptyEntry } from '../types';
import type { ScrapedPair } from '../lib/geminiImport';
import ImageEntryEditor from './ImageEntryEditor';
import GeminiImport from './GeminiImport';
import SynthesizePanel from './SynthesizePanel';

interface Props {
  submission: Submission;
  onChange: (patch: Partial<Submission>) => void;
}

export default function SubmissionForm({ submission, onChange }: Props) {
  const dragIndex = useRef<number | null>(null);
  const [dragEnabledId, setDragEnabledId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

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

  function importGroup(link: string, pairs: ScrapedPair[]) {
    const group: ImportGroup = {
      id: crypto.randomUUID(),
      source: 'gemini',
      link,
      label: `Gemini · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };
    const newEntries: ImageEntry[] = pairs.map((p) => ({
      ...emptyEntry(group.id),
      prompt: p.prompt,
      imageUrl: p.imageUrl,
      geminiLink: link.startsWith('http') ? link : '',
    }));
    onChange({
      groups: [...submission.groups, group],
      entries: [...submission.entries, ...newEntries],
    });
  }

  function removeGroup(groupId: string) {
    onChange({
      groups: submission.groups.filter((g) => g.id !== groupId),
      entries: submission.entries.filter((e) => e.groupId !== groupId),
    });
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...submission.entries];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange({ entries: next });
  }

  const field =
    'w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400';
  const label = 'mb-1 block text-xs font-medium text-slate-600';

  const groupLabelFor = (groupId?: string) =>
    groupId ? submission.groups.find((g) => g.id === groupId)?.label : undefined;

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
        <SynthesizePanel onApply={onChange} />
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

        {/* Gemini import sits at the top of image documentation */}
        <GeminiImport onImport={importGroup} />

        {/* Active import groups — delete a whole batch if it was the wrong link */}
        {submission.groups.length > 0 && (
          <div className="space-y-1.5">
            {submission.groups.map((g) => {
              const count = submission.entries.filter((e) => e.groupId === g.id).length;
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-1.5 text-xs ring-1 ring-blue-200"
                >
                  <span className="truncate text-blue-800">
                    <span className="font-medium">{g.label}</span> — {count} figure(s) ·{' '}
                    <span className="text-blue-600/70">{g.link}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGroup(g.id)}
                    className="ml-2 shrink-0 font-medium text-red-600 hover:text-red-800"
                  >
                    Delete batch
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-4">
          {submission.entries.map((entry, i) => (
            <div
              key={entry.id}
              draggable={dragEnabledId === entry.id}
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={() => {
                if (dragIndex.current !== null) reorder(dragIndex.current, i);
                dragIndex.current = null;
                setOverIndex(null);
                setDragEnabledId(null);
              }}
              onDragEnd={() => {
                dragIndex.current = null;
                setOverIndex(null);
                setDragEnabledId(null);
              }}
              className={overIndex === i ? 'rounded-lg ring-2 ring-amber-300' : ''}
            >
              <ImageEntryEditor
                entry={entry}
                index={i}
                previousPrompt={i > 0 ? submission.entries[i - 1].prompt : undefined}
                groupLabel={groupLabelFor(entry.groupId)}
                onChange={(patch) => patchEntry(entry.id, patch)}
                onRemove={() => removeEntry(entry.id)}
                canRemove={submission.entries.length > 1}
                onHandleMouseDown={() => setDragEnabledId(entry.id)}
                onHandleMouseUp={() => setDragEnabledId(null)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
