import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Analytics } from '@vercel/analytics/react';
import type { Submission } from './types';
import { emptySubmission } from './types';
import { useI18n } from './lib/i18n';
import SubmissionForm from './components/SubmissionForm';
import WhitePaper from './components/WhitePaper';
import PdfDocument from './components/PdfDocument';
import LanguageToggle from './components/LanguageToggle';

export default function App() {
  const { t, lang } = useI18n();
  const [submission, setSubmission] = useState<Submission>(emptySubmission);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [generating, setGenerating] = useState(false);

  function patch(p: Partial<Submission>) {
    setSubmission((prev) => ({ ...prev, ...p }));
  }

  async function downloadPdf() {
    setGenerating(true);
    try {
      const blob = await pdf(<PdfDocument submission={submission} lang={lang} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slug =
        submission.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
        'white-paper';
      a.href = url;
      a.download = `${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Analytics />
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-base font-bold text-slate-900">{t('app.title')}</h1>
            <p className="text-xs text-slate-500">{t('app.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
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
