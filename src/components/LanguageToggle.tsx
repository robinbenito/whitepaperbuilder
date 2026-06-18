import { useI18n, type Lang } from '../lib/i18n';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
];

/** Global EN/DE language switch. The choice is persisted by the i18n provider. */
export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className="flex rounded-md border border-slate-300 p-0.5 text-xs font-medium"
      role="group"
      aria-label={t('lang.label')}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setLang(opt.value)}
          aria-pressed={lang === opt.value}
          className={`rounded px-2.5 py-1 ${
            lang === opt.value ? 'bg-slate-800 text-white' : 'text-slate-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
