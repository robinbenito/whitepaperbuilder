// react-pdf can only embed PNG and JPEG bitmaps. Drafts, however, can contain
// WebP/AVIF data URLs (the formats AI image tools serve) and remote image URLs
// (from imports and pasted HTML). Those images previously vanished from the
// exported PDF without a word. Before rendering, every image is converted to a
// PNG/JPEG data URL via canvas; images that cannot be decoded or fetched are
// dropped, and the caller is told how many so it can warn the user.

import type { Submission } from '../types';

const EMBEDDABLE = /^data:image\/(png|jpe?g)[;,]/i;

/** Longest edge for converted images — comfortably above A4 print resolution. */
const MAX_EDGE = 3000;

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
 * Returns the image as a PNG/JPEG data URL react-pdf can embed, converting it
 * if necessary, or null when the image can't be decoded (unknown format,
 * unreachable/CORS-blocked URL). Already-embeddable images pass through
 * byte-identical.
 */
export async function toEmbeddableImage(url: string): Promise<string | null> {
  if (!url) return null;
  if (EMBEDDABLE.test(url)) return url;
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight, 1));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return hasTransparency(ctx, w, h)
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    return null;
  }
}

export interface PdfReadySubmission {
  submission: Submission;
  /** Images that could not be converted and were left out of the PDF. */
  missingImages: number;
}

/** Copy of the submission with every image embeddable; undecodable ones removed. */
export async function withEmbeddableImages(submission: Submission): Promise<PdfReadySubmission> {
  let missingImages = 0;
  const convert = async (url: string): Promise<string> => {
    const converted = await toEmbeddableImage(url);
    if (url && converted === null) missingImages++;
    return converted ?? '';
  };

  const entries = [];
  // Entries sequentially (not Promise.all) so a big draft doesn't decode
  // dozens of multi-megabyte images at once.
  for (const e of submission.entries) {
    const imageUrl = await convert(e.imageUrl);
    const contextImages = [];
    for (const c of e.contextImages) {
      contextImages.push({ ...c, imageUrl: await convert(c.imageUrl) });
    }
    entries.push({ ...e, imageUrl, contextImages });
  }
  return { submission: { ...submission, entries }, missingImages };
}
