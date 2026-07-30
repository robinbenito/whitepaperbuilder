import { useRef, useState } from 'react';
import { readFileAsDataUrl, firstImageFile } from '../lib/image';
import { toEmbeddableImage } from '../lib/pdfImages';

interface Props {
  imageUrl?: string;
  fileName?: string;
  onImage: (dataUrl: string, fileName: string) => void;
  onClear?: () => void;
  placeholder?: string;
  /** Tailwind classes controlling the box size (default: square thumbnail). */
  className?: string;
  alt?: string;
}

/**
 * Image input that accepts click-to-upload, drag-and-drop, and clipboard paste.
 * Paste works when the zone is focused (it's keyboard-focusable, tabIndex=0).
 */
export default function ImageDropzone({
  imageUrl,
  fileName,
  onImage,
  onClear,
  placeholder = 'Click, drop, or paste',
  className = 'aspect-square w-full',
  alt = 'image',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function accept(file: File | null) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    // Store PNG/JPEG only: other formats (WebP/AVIF/HEIC…) can't be embedded
    // in the exported PDF. Fall back to the raw data if conversion fails so
    // the on-screen preview still works.
    const embeddable = await toEmbeddableImage(dataUrl);
    onImage(embeddable ?? dataUrl, file.name || 'pasted-image.png');
  }

  return (
    <div className="space-y-1">
      <div
        tabIndex={0}
        role="button"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onPaste={(e) => accept(firstImageFile(e.clipboardData))}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          accept(firstImageFile(e.dataTransfer));
        }}
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-md outline-none transition ${className} ${
          imageUrl
            ? 'ring-1 ring-slate-300'
            : 'border-2 border-dashed border-slate-300 text-center text-[11px] text-slate-400'
        } ${dragOver ? 'border-amber-400 ring-2 ring-amber-300' : ''} focus:ring-2 focus:ring-amber-400`}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
            {onClear && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                aria-label="Remove image"
              >
                ×
              </button>
            )}
          </>
        ) : (
          <span className="px-1">{placeholder}</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => accept(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </div>
      {fileName && <p className="truncate text-[11px] text-slate-400">{fileName}</p>}
    </div>
  );
}
