import { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Analytics } from '@vercel/analytics/react';
import type { Submission } from './types';
import { emptySubmission } from './types';
import { useI18n, type Translate } from './lib/i18n';
import { loadSubmission, clearSubmission } from './lib/persistence';
import { withEmbeddableImages } from './lib/pdfImages';
import { addPageNumbers } from './lib/pageNumbers';
import { useAutosave, type SaveStatus } from './lib/useAutosave';
import SubmissionForm from './components/SubmissionForm';
import WhitePaper from './components/WhitePaper';
import PdfDocument from './components/PdfDocument';
import LanguageToggle from './components/LanguageToggle';

export default function App() {
  // Restore a previously saved draft so users can come and go and keep
  // iterating. Loading is async (IndexedDB), so the editor — and with it the
  // autosave that could overwrite the stored draft — only mounts once the
  // load has finished. The local read takes milliseconds.
  const [restored, setRestored] = useState<{ draft: Submission | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSubmission()
      .catch(() => null)
      .then((draft) => {
        if (!cancelled) setRestored({ draft });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!restored) return <Analytics />;
  return (
    <>
      <Analytics />
      <Editor initialDraft={restored.draft} />
    </>
  );
}

function Editor({ initialDraft }: { initialDraft: Submission | null }) {
  const { t, lang } = useI18n();
  const [submission, setSubmission] = useState<Submission>(() => initialDraft ?? emptySubmission());
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [generating, setGenerating] = useState(false);
  const [showRestored, setShowRestored] = useState(!!initialDraft);

  const saveStatus = useAutosave(submission);

  function patch(p: Partial<Submission>) {
    setSubmission((prev) => ({ ...prev, ...p }));
  }

  function startOver() {
    if (!window.confirm(t('startOver.confirm'))) return;
    void clearSubmission();
    setSubmission(emptySubmission());
    setTab('edit');
  }

  async function downloadPdf() {
    setGenerating(true);
    try {
      // Convert images react-pdf can't embed (WebP/AVIF data URLs, remote
      // URLs) to PNG/JPEG first; without this they silently vanish from the
      // PDF — or, for undecodable ones, sink the whole export.
      const { submission: printable, missingImages } = await withEmbeddableImages(submission);
      let blob = await pdf(<PdfDocument submission={printable} lang={lang} />).toBlob();
      try {
        blob = await addPageNumbers(blob);
      } catch (e) {
        // A PDF without page numbers still beats no PDF at all.
        console.error('Stamping page numbers failed', e);
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug =
        submission.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
        'white-paper';
      a.href = url;
      a.download = `${slug}.pdf`;
      // Attach the anchor and defer the revoke: Safari can cancel the download
      // if the blob URL is revoked before the save actually starts.
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      if (missingImages > 0) {
        alert(t('pdf.missingImages').replace('{n}', String(missingImages)));
      }
    } catch (e) {
      // Surface the failure — a silent no-op download button is undebuggable.
      console.error('PDF export failed', e);
      alert(t('pdf.failed'));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-base font-bold text-slate-900">{t('app.title')}</h1>
            <p className="text-xs text-slate-500">{t('app.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <SaveIndicator status={saveStatus} t={t} />
            <button
              onClick={startOver}
              className="hidden rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-block"
            >
              {t('startOver')}
            </button>
            <LanguageToggle />
            <div className="flex rounded-md border border-slate-300 p-0.5 text-xs font-medium md:hidden">
              <button
                onClick={() => setTab('edit')}
                className={`rounded px-3 py-1 ${tab === 'edit' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
              >
                {t('tab.edit')}
              </button>
              <button
                onClick={() => setTab('preview')}
                className={`rounded px-3 py-1 ${tab === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
              >
                {t('tab.preview')}
              </button>
            </div>
            <button
              onClick={downloadPdf}
              disabled={generating}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
            >
              {generating ? t('download.generating') : t('download.pdf')}
            </button>
          </div>
        </div>
      </header>

      {showRestored && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">
          <span>{t('restore.banner')}</span>
          <button
            onClick={() => setShowRestored(false)}
            className="font-medium text-amber-700 hover:text-amber-900"
          >
            {t('restore.dismiss')}
          </button>
        </div>
      )}

      {/*
        The editor (left) grows to claim spare width while the preview (right) is
        capped at the document's natural width (800px page + 2rem padding = 832px)
        so very wide viewports don't leave empty gutters around the preview.
      */}
      <main className="grid w-full gap-6 px-6 py-6 md:grid-cols-[minmax(360px,1fr)_minmax(0,832px)]">
        <section className={`${tab === 'edit' ? 'block' : 'hidden'} md:block`}>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SubmissionForm submission={submission} onChange={patch} />
          </div>
        </section>

        <section className={`${tab === 'preview' ? 'block' : 'hidden'} min-w-0 md:block`}>
          <div className="sticky top-20">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              {t('preview.live')}
            </p>
            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl bg-slate-200/60 p-4">
              <WhitePaper submission={submission} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SaveIndicator({ status, t }: { status: SaveStatus; t: Translate }) {
  const map: Record<SaveStatus, { key: Parameters<Translate>[0]; className: string }> = {
    idle: { key: 'save.saved', className: 'text-slate-400' },
    saving: { key: 'save.saving', className: 'text-slate-400' },
    saved: { key: 'save.savedTick', className: 'text-emerald-600' },
    quota: { key: 'save.quota', className: 'text-amber-600' },
    error: { key: 'save.error', className: 'text-amber-600' },
  };
  const { key, className } = map[status];
  return (
    <span className={`hidden text-xs font-medium sm:inline ${className}`} title={t('save.tooltip')}>
      {t(key)}
    </span>
  );
}
