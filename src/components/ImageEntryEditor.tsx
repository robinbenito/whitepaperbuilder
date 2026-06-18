import type { ImageEntry, ContextImage } from '../types';
import HighlightedPrompt from './HighlightedPrompt';
import ImageDropzone from './ImageDropzone';
import { markDifferences, clearMarks } from '../lib/promptDiff';
import { useI18n } from '../lib/i18n';

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
  const { t } = useI18n();
  function addContextImage(imageUrl: string, fileName: string) {
    const img: ContextImage = { id: crypto.randomUUID(), imageUrl, fileName };
    onChange({ contextImages: [...entry.contextImages, img] });
  }
  function removeContextImage(id: string) {
    onChange({ contextImages: entry.contextImages.filter((c) => c.id !== id) });
  }

  const hasMarks = /==[^=]+==/.test(entry.prompt);
  const canDiff = (previousPrompt?.trim().length ?? 0) > 0 && entry.prompt.trim().length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            title={t('entry.dragReorder')}
            onMouseDown={onHandleMouseDown}
            onMouseUp={onHandleMouseUp}
            className="cursor-grab select-none rounded px-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 active:cursor-grabbing"
            aria-label={t('entry.dragReorder')}
          >
            ⠿
          </button>
          <h3 className="text-sm font-semibold text-slate-700">
            {t('entry.figure')} {index + 1}
          </h3>
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
            {t('entry.remove')}
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
            placeholder={t('entry.resultPlaceholder')}
            alt={`${t('entry.figure')} ${index + 1}`}
          />
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-xs font-medium text-slate-600">{t('entry.prompt')}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange({ prompt: markDifferences(entry.prompt, previousPrompt) })
                  }
                  disabled={!canDiff}
                  className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t('entry.highlightDiff')}
                </button>
                {hasMarks && (
                  <button
                    type="button"
                    onClick={() => onChange({ prompt: clearMarks(entry.prompt) })}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
                  >
                    {t('entry.clear')}
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={entry.prompt}
              onChange={(e) => onChange({ prompt: e.target.value })}
              rows={3}
              placeholder={t('entry.promptPlaceholder')}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <p className="mt-1 text-[10px] text-slate-400">{t('entry.promptHint')}</p>
            {hasMarks && entry.prompt && (
              <div className="mt-1.5 rounded-md bg-white px-2 py-1.5 text-xs ring-1 ring-slate-200">
                <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-400">
                  {t('entry.preview')}
                </span>
                <HighlightedPrompt prompt={entry.prompt} />
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('entry.geminiLink')}
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
                {t('entry.chatgptLink')}
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
              {t('entry.contextImages')}{' '}
              <span className="font-normal text-slate-400">{t('entry.contextImagesHint')}</span>
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
                    alt={t('entry.contextImages')}
                  />
                </div>
              ))}
              <div className="w-16">
                <ImageDropzone
                  onImage={addContextImage}
                  placeholder={t('entry.addContext')}
                  className="h-16 w-16"
                  alt={t('entry.addContext')}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              {t('entry.notes')} <span className="font-normal text-slate-400">{t('entry.optional')}</span>
            </label>
            <textarea
              value={entry.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              rows={2}
              placeholder={t('entry.notesPlaceholder')}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
