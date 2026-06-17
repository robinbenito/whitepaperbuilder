import type { ImageEntry } from '../types';

interface Props {
  entry: ImageEntry;
  index: number;
  onChange: (patch: Partial<ImageEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageEntryEditor({ entry, index, onChange, onRemove, canRemove }: Props) {
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    onChange({ imageUrl: dataUrl, fileName: file.name });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Figure {index + 1}</h3>
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
            <label className="mb-1 block text-xs font-medium text-slate-600">Prompt</label>
            <textarea
              value={entry.prompt}
              onChange={(e) => onChange({ prompt: e.target.value })}
              rows={3}
              placeholder="The exact prompt used to generate this image…"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
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
