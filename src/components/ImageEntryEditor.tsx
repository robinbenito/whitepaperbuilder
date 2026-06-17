import type { ImageEntry, ContextImage } from '../types';
import HighlightedPrompt from './HighlightedPrompt';
import ImageDropzone from './ImageDropzone';

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
  function addContextImage(imageUrl: string, fileName: string) {
    const img: ContextImage = { id: crypto.randomUUID(), imageUrl, fileName };
    onChange({ contextImages: [...entry.contextImages, img] });
  }
  function removeContextImage(id: string) {
    onChange({ contextImages: entry.contextImages.filter((c) => c.id !== id) });
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
          <ImageDropzone
            imageUrl={entry.imageUrl}
            fileName={entry.fileName}
            onImage={(url, name) => onChange({ imageUrl: url, fileName: name })}
            onClear={() => onChange({ imageUrl: '', fileName: '' })}
            placeholder="Result image — click, drop, or paste"
            alt={`Figure ${index + 1}`}
          />
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

          {/* Optional context / input images fed to the model */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Context images{' '}
              <span className="font-normal text-slate-400">(optional — inputs to the prompt)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {entry.contextImages.map((c) => (
                <div key={c.id} className="w-16">
                  <ImageDropzone
                    imageUrl={c.imageUrl}
                    onImage={(url) =>
                      onChange({
                        contextImages: entry.contextImages.map((ci) =>
                          ci.id === c.id ? { ...ci, imageUrl: url } : ci,
                        ),
                      })
                    }
                    onClear={() => removeContextImage(c.id)}
                    className="h-16 w-16"
                    alt="Context image"
                  />
                </div>
              ))}
              <div className="w-16">
                <ImageDropzone
                  onImage={addContextImage}
                  placeholder="+ add"
                  className="h-16 w-16"
                  alt="Add context image"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
