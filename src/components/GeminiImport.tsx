import { useState } from 'react';
import { scrapeGemini, parsePastedContent, type ScrapedPair } from '../lib/geminiImport';
import { useI18n } from '../lib/i18n';

interface Props {
  onImport: (link: string, pairs: ScrapedPair[]) => void;
}

/**
 * Grouped "Import from Gemini" block. Tries the serverless scraper first; if it
 * returns nothing (e.g. running locally, or Gemini markup changed) it reveals a
 * paste box so the user can paste the conversation / saved HTML instead.
 */
export default function GeminiImport({ onImport }: Props) {
  const { t } = useI18n();
  const [link, setLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [pasted, setPasted] = useState('');

  async function handleScrape() {
    if (!link.trim()) return;
    setStatus('loading');
    setMessage(null);
    const result = await scrapeGemini(link.trim());
    setStatus('idle');
    if (result.pairs.length) {
      onImport(link.trim(), result.pairs);
      setMessage(`Imported ${result.pairs.length} image-prompt pair(s).`);
      setLink('');
    } else {
      setMessage(
        result.error
          ? `Couldn't auto-scrape (${result.error}). Paste the conversation below instead.`
          : 'No images found at that link. Paste the conversation below instead.',
      );
      setShowPaste(true);
    }
  }

  function handlePaste() {
    const pairs = parsePastedContent(pasted);
    if (!pairs.length) {
      setMessage('No image-prompt pairs found in the pasted content.');
      return;
    }
    onImport(link.trim() || 'manual paste', pairs);
    setMessage(`Imported ${pairs.length} pair(s) from pasted content.`);
    setPasted('');
    setShowPaste(false);
    setLink('');
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
      <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-blue-800">
        {t('gemini.title')}
      </h3>
      <p className="mb-3 text-xs text-blue-700/80">{t('gemini.desc')}</p>
      <div className="flex gap-2">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://gemini.google.com/share/…"
          className="w-full rounded-md border border-blue-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleScrape}
          disabled={status === 'loading' || !link.trim()}
          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'loading' ? t('gemini.scraping') : t('gemini.import')}
        </button>
      </div>

      {message && <p className="mt-2 text-xs text-blue-800">{message}</p>}

      {showPaste && (
        <div className="mt-3 space-y-2">
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={5}
            placeholder={t('gemini.pastePlaceholder')}
            className="w-full rounded-md border border-blue-300 px-2 py-1.5 font-mono text-[11px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handlePaste}
            disabled={!pasted.trim()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t('gemini.parse')}
          </button>
        </div>
      )}
    </div>
  );
}
