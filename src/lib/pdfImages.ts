// react-pdf can only embed PNG and JPEG bitmaps. Drafts, however, can contain
// WebP/AVIF data URLs (the formats AI image tools serve) and remote image URLs
// (from imports and pasted HTML). On top of the format constraint, source
// images (phone photos, AI outputs) are typically far larger than they can
// ever render in the document, bloating drafts and exported PDFs. Images are
// therefore normalized: decoded, downscaled to their 150 ppi pixel budget,
// and re-encoded as JPEG (PNG when transparent). Images that cannot be
// decoded or fetched are dropped at export, and the caller is told how many.

import type { Submission } from '../types';

const EMBEDDABLE = /^data:image\/(png|jpe?g)[;,]/i;

// Pixel budgets: 150 ppi over the largest box each image can occupy in the
// PDF (see PdfDocument styles — A4 content width 595 − 2×64 = 467pt; figure
// box 467×300pt; context-image column ≈151×130pt; px = pt/72 × ppi). Revisit
// these if the PDF layout changes.
const PPI = 150;
const px = (pt: number) => Math.round((pt / 72) * PPI);

export interface PixelBox {
  width: number;
  height: number;
}

/** Budget for an entry's main figure image (973×625). */
export const FIGURE_MAX_PX: PixelBox = { width: px(467), height: px(300) };
/** Budget for the small context/input thumbnails (315×271). */
export const CONTEXT_MAX_PX: PixelBox = { width: px(151), height: px(130) };

const JPEG_QUALITY = 0.9;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Canvas readback of cross-origin images requires CORS approval from the
    // host; without it the load errors and the image is dropped with a warning.
    if (!url.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = url;
  });
}

/** Sample the alpha channel; JPEG (much smaller) is only safe for opaque images. */
function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < data.length; i += 4 * 61) {
    if (data[i] < 255) return true;
  }
  return false;
}

/**
 * Returns the image as a PNG/JPEG data URL react-pdf can embed, downscaled to
 * the given pixel budget. Images already in the right format and within
 * budget pass through byte-identical. Returns null when the image can't be
 * decoded at all (unknown format, unreachable/CORS-blocked URL).
 */
export async function toEmbeddableImage(
  url: string,
  box: PixelBox = FIGURE_MAX_PX,
): Promise<string | null> {
  if (!url) return null;
  const embeddableFormat = EMBEDDABLE.test(url);
  try {
    const img = await loadImage(url);
    const scale = Math.min(
      box.width / Math.max(img.naturalWidth, 1),
      box.height / Math.max(img.naturalHeight, 1),
      1,
    );
    if (embeddableFormat && scale === 1) return url;
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return embeddableFormat ? url : null;
    ctx.drawImage(img, 0, 0, w, h);
    return hasTransparency(ctx, w, h)
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch {
    // Undecodable: keep an already-embeddable original rather than losing it;
    // anything else can't be salvaged.
    return embeddableFormat ? url : null;
  }
}

export interface PdfReadySubmission {
  submission: Submission;
  /** Images that could not be converted and were left out of the PDF. */
  missingImages: number;
}

/** Copy of the submission with every image embeddable and within its 150 ppi
 * budget; undecodable ones removed. */
export async function withEmbeddableImages(submission: Submission): Promise<PdfReadySubmission> {
  let missingImages = 0;
  const convert = async (url: string, box: PixelBox): Promise<string> => {
    const converted = await toEmbeddableImage(url, box);
    if (url && converted === null) missingImages++;
    return converted ?? '';
  };

  const entries = [];
  // Entries sequentially (not Promise.all) so a big draft doesn't decode
  // dozens of multi-megabyte images at once.
  for (const e of submission.entries) {
    const imageUrl = await convert(e.imageUrl, FIGURE_MAX_PX);
    const contextImages = [];
    for (const c of e.contextImages) {
      contextImages.push({ ...c, imageUrl: await convert(c.imageUrl, CONTEXT_MAX_PX) });
    }
    entries.push({ ...e, imageUrl, contextImages });
  }
  return { submission: { ...submission, entries }, missingImages };
}
