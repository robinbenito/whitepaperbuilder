export interface ScrapedPair {
  prompt: string;
  imageUrl: string; // may be a remote URL (from scrape) or data URL (from upload)
}

export interface ScrapeResult {
  pairs: ScrapedPair[];
  source: 'server' | 'empty';
  error?: string;
}

/**
 * Ask the Vercel serverless endpoint to scrape a Gemini share link.
 * Returns pairs on success; on any failure returns an empty result with an error
 * message so the UI can fall back to manual paste.
 */
export async function scrapeGemini(url: string): Promise<ScrapeResult> {
  try {
    const res = await fetch(`/api/gemini-scrape?url=${encodeURIComponent(url)}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      return { pairs: [], source: 'empty', error: `Scraper returned HTTP ${res.status}` };
    }
    const data = (await res.json()) as { pairs?: ScrapedPair[]; error?: string };
    if (data.error) return { pairs: [], source: 'empty', error: data.error };
    const pairs = (data.pairs ?? []).filter((p) => p.prompt || p.imageUrl);
    return { pairs, source: pairs.length ? 'server' : 'empty' };
  } catch (e) {
    return {
      pairs: [],
      source: 'empty',
      error: e instanceof Error ? e.message : 'Network error reaching scraper',
    };
  }
}

/**
 * Fallback parser for pasted conversation content. Handles two shapes:
 *  - Saved HTML: extracts <img src> and the text around them.
 *  - Plain text: each blank-line-separated block becomes a prompt.
 */
export function parsePastedContent(text: string): ScrapedPair[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (/<img\s|<\/?\w+>/i.test(trimmed)) {
    const doc = new DOMParser().parseFromString(trimmed, 'text/html');
    const imgs = Array.from(doc.querySelectorAll('img'));
    if (imgs.length) {
      return imgs.map((img) => {
        // Use alt text or a nearby figcaption/sibling text as the prompt.
        const caption =
          img.getAttribute('alt') ||
          img.closest('figure')?.querySelector('figcaption')?.textContent ||
          img.parentElement?.textContent ||
          '';
        return { prompt: caption.trim().slice(0, 600), imageUrl: img.getAttribute('src') ?? '' };
      });
    }
  }

  // Plain text: split into blocks on blank lines.
  return trimmed
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({ prompt: block, imageUrl: '' }));
}
