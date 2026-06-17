import type { ImageEntry } from '../types';
import HighlightedPrompt from './HighlightedPrompt';

interface Props {
  entry: ImageEntry;
  index: number;
  previousPrompt?: string;
  groupLabel?: string;
  onChange: (patch: Partial<ImageEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
  onHandleMouseDown: () => void;
  onHandleMouseUp: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageEntryEditor({
  entry,
  index,
  previousPrompt,
  groupLabel,
  onChange,
  onRemove,
  canRemove,
  onHandleMouseDown,
  onHandleMouseUp,
}: Props) {
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    onChange({ imageUrl: dataUrl, fileName: file.name });
  }

  const hasHighlight = /==[^=]+==/.test(entry.prompt) || (previousPrompt?.trim().length ?? 0) > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Drag to reorder"
            onMouseDown={onHandleMouseDown}
            onMouseUp={onHandleMouseUp}
            className="cursor-grab select-none rounded px-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            ⠿
          </button>
          <h3 className="text-sm font-semibold text-slate-700">Figure {index + 1}</h3>
          {groupLabel && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
              {groupLabel}
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <div>
          <label className="block cursor-pointer">
            {entry.imageUrl ? (
              <img
                src={entry.imageUrl}
                alt={`Figure ${index + 1}`}
                className="aspect-square w-full rounded-md object-cover ring-1 ring-slate-300"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-md border-2 border-dashed border-slate-300 text-center text-xs text-slate-400">
                Click to upload image
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          {entry.fileName && (
            <p className="mt-1 truncate text-[11px] text-slate-400">{entry.fileName}</p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-600">Prompt</label>
              <span className="text-[10px] text-slate-400">
                wrap text in <code className="font-mono">==…==</code> to force-highlight
              </span>
            </div>
            <textarea
              value={entry.prompt}
              onChange={(e) => onChange({ prompt: e.target.value })}
              rows={3}
              placeholder="The exact prompt used to generate this image…"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            {hasHighlight && entry.prompt && (
              <div className="mt-1.5 rounded-md bg-white px-2 py-1.5 text-xs ring-1 ring-slate-200">
                <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-400">
                  {/==[^=]+==/.test(entry.prompt) ? 'Highlighted' : 'Changes vs. previous'}:
                </span>
                <HighlightedPrompt prompt={entry.prompt} previous={previousPrompt} />
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Gemini chat link
              </label>
              <input
                type="url"
                value={entry.geminiLink}
                onChange={(e) => onChange({ geminiLink: e.target.value })}
                placeholder="https://gemini.google.com/…"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                ChatGPT chat link
              </label>
              <input
                type="url"
                value={entry.chatgptLink}
                onChange={(e) => onChange({ chatgptLink: e.target.value })}
                placeholder="https://chatgpt.com/…"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
