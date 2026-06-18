import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Submission } from '../types';
import HighlightedPrompt from './HighlightedPrompt';
import { useI18n } from '../lib/i18n';

interface Props {
  submission: Submission;
}

export default function WhitePaper({ submission }: Props) {
  const { t } = useI18n();
  const { title, studentName, course, date, abstract, synthesis, entries } = submission;
  const figured = entries.filter((e) => e.imageUrl || e.prompt);
  const references = entries.flatMap((e, i) => {
    const refs: { label: string; url: string; idx: number }[] = [];
    if (e.geminiLink) refs.push({ label: 'Google Gemini', url: e.geminiLink, idx: i + 1 });
    if (e.chatgptLink) refs.push({ label: 'ChatGPT Image', url: e.chatgptLink, idx: i + 1 });
    return refs;
  });

  return (
    <article className="mx-auto max-w-[800px] bg-white px-12 py-14 shadow-sm prose-academic">
      {/* Title block */}
      <header className="mb-10 border-b border-slate-200 pb-8 text-center">
        <h1 className="!mt-0 text-[1.75rem] font-bold leading-tight text-slate-900">
          {title || t('doc.untitled')}
        </h1>
        <p className="mt-3 text-base text-slate-600">{studentName || t('doc.anonymous')}</p>
        <p className="text-sm text-slate-500">
          {course}
          {date && ` · ${new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`}
        </p>
      </header>

      {/* Abstract */}
      {abstract && (
        <section className="mb-8">
          <h2 className="!mt-0 text-center text-base font-bold uppercase tracking-widest text-slate-700">
            {t('doc.abstract')}
          </h2>
          <p className="mx-auto max-w-[90%] text-center text-[0.95rem] italic text-slate-600">
            {abstract}
          </p>
        </section>
      )}

      {/* Synthesis */}
      <section className="mb-10">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{synthesis}</ReactMarkdown>
      </section>

      {/* Image documentation */}
      {figured.length > 0 && (
        <section className="mb-10">
          <h2 className="border-b border-slate-200 pb-1 text-lg font-bold text-slate-800">
            {t('doc.imageDoc')}
          </h2>
          <div className="space-y-10 pt-4">
            {figured.map((e, i) => (
              <figure key={e.id} className="border-b border-slate-300 pb-8">
                {/* Inputs (context + prompt) sit above the image to show cause → effect. */}
                <div
                  className={`mb-4 grid gap-5 text-left text-sm text-slate-600 ${
                    e.contextImages.length > 0 ? 'grid-cols-3' : 'grid-cols-1'
                  }`}
                >
                  {e.contextImages.length > 0 && (
                    <div className="col-span-1">
                      <span className="text-[11px] uppercase tracking-wide text-slate-400">
                        {t('doc.contextInputs')}
                      </span>
                      <div className="mt-1 flex flex-col gap-2">
                        {e.contextImages.map(
                          (c) =>
                            c.imageUrl && (
                              <img
                                key={c.id}
                                src={c.imageUrl}
                                alt="context input"
                                className="max-h-48 w-full rounded object-contain ring-1 ring-slate-200"
                              />
                            ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className={e.contextImages.length > 0 ? 'col-span-2' : ''}>
                    {e.prompt && (
                      <div>
                        {/* Label matches "Context inputs" so the two are top-aligned;
                            the prompt itself begins on the next line. */}
                        <span className="text-[11px] uppercase tracking-wide text-slate-400">
                          {t('doc.prompt')}
                        </span>
                        <p className="m-0 mt-1">
                          <HighlightedPrompt prompt={e.prompt} />
                        </p>
                      </div>
                    )}
                    {(e.geminiLink || e.chatgptLink) && (
                      <span className="mt-2 flex flex-wrap gap-2">
                        {e.geminiLink && (
                          <a
                            href={e.geminiLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium !text-blue-700 !no-underline ring-1 ring-blue-200"
                          >
                            {t('doc.viewGemini')}
                          </a>
                        )}
                        {e.chatgptLink && (
                          <a
                            href={e.chatgptLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium !text-emerald-700 !no-underline ring-1 ring-emerald-200"
                          >
                            {t('doc.viewChatGPT')}
                          </a>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Result image, captioned by its figure number. */}
                {e.imageUrl && (
                  <img
                    src={e.imageUrl}
                    alt={`Figure ${i + 1}`}
                    className="mx-auto max-h-[460px] rounded-md ring-1 ring-slate-200"
                  />
                )}
                <figcaption className="mt-2 text-center text-sm font-semibold text-slate-700">
                  {t('doc.figure')} {i + 1}.
                </figcaption>

                {e.notes.trim() && (
                  <p className="mt-3 text-left text-sm italic text-slate-600">
                    <span className="not-italic font-semibold text-slate-500">{t('doc.notes')}: </span>
                    {e.notes}
                  </p>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* References */}
      {references.length > 0 && (
        <section>
          <h2 className="border-b border-slate-200 pb-1 text-lg font-bold text-slate-800">
            {t('doc.references')}
          </h2>
          <ol className="pt-3 text-sm">
            {references.map((r, i) => (
              <li key={i} className="break-all">
                [{i + 1}] {r.label} — {t('doc.refConversation')} {r.idx}.{' '}
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.url}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
