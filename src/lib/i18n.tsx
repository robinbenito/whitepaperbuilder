import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'de';

/** All translatable UI and document strings. Keys are stable; values per language. */
const dict = {
  // App chrome
  'app.title': { en: 'Generative Image — White Paper Builder', de: 'Generative Bilder — White-Paper-Builder' },
  'app.subtitle': {
    en: 'Document your prompt experiments and export an academic PDF.',
    de: 'Dokumentiere deine Prompt-Experimente und exportiere ein akademisches PDF.',
  },
  'tab.edit': { en: 'Edit', de: 'Bearbeiten' },
  'tab.preview': { en: 'Preview', de: 'Vorschau' },
  'preview.live': { en: 'Live preview', de: 'Live-Vorschau' },
  'download.pdf': { en: '⬇ Download PDF', de: '⬇ PDF herunterladen' },
  'download.generating': { en: 'Generating…', de: 'Wird erstellt…' },
  'lang.label': { en: 'Language', de: 'Sprache' },

  // Autosave / restore
  'save.saved': { en: 'Saved locally', de: 'Lokal gespeichert' },
  'save.saving': { en: 'Saving…', de: 'Wird gespeichert…' },
  'save.savedTick': { en: '✓ Saved locally', de: '✓ Lokal gespeichert' },
  'save.quota': { en: '⚠ Device storage full — draft not saved', de: '⚠ Speicherplatz voll — Entwurf nicht gespeichert' },
  'save.error': { en: '⚠ Couldn’t save', de: '⚠ Speichern fehlgeschlagen' },
  'save.tooltip': {
    en: 'Your draft is stored only in this browser — it never leaves your device.',
    de: 'Dein Entwurf wird nur in diesem Browser gespeichert — er verlässt dein Gerät nie.',
  },
  'startOver': { en: 'Start over', de: 'Neu beginnen' },
  'startOver.confirm': {
    en: 'Start a new white paper? This clears the draft saved in this browser and cannot be undone.',
    de: 'Ein neues White Paper beginnen? Dies löscht den in diesem Browser gespeicherten Entwurf unwiderruflich.',
  },
  'restore.banner': {
    en: '↺ Restored your previous draft from this browser.',
    de: '↺ Vorherigen Entwurf aus diesem Browser wiederhergestellt.',
  },
  'restore.dismiss': { en: 'Dismiss', de: 'Ausblenden' },

  // Form sections / fields
  'form.titleBlock': { en: 'Title block', de: 'Titelblock' },
  'form.paperTitle': { en: 'Paper title', de: 'Titel der Arbeit' },
  'form.studentName': { en: 'Student name', de: 'Name' },
  'form.course': { en: 'Course', de: 'Kurs' },
  'form.date': { en: 'Date', de: 'Datum' },
  'form.abstract': { en: 'Abstract', de: 'Zusammenfassung' },
  'form.synthesis': { en: 'Synthesis', de: 'Synthese' },
  'form.markdown': { en: '(Markdown)', de: '(Markdown)' },
  'form.imageDoc': { en: 'Image documentation', de: 'Bilddokumentation' },
  'form.addFigure': { en: '+ Add figure', de: '+ Abbildung hinzufügen' },
  'form.deleteBatch': { en: 'Delete batch', de: 'Stapel löschen' },
  'form.figuresCount': { en: 'figure(s)', de: 'Abbildung(en)' },

  // Gemini import
  'gemini.title': { en: '◆ Import from Gemini', de: '◆ Aus Gemini importieren' },
  'gemini.desc': {
    en: 'Paste a Gemini share link to auto-fill image-prompt pairs. Imported items are grouped so you can remove the whole batch if it was the wrong link.',
    de: 'Füge einen Gemini-Freigabelink ein, um Bild-Prompt-Paare automatisch zu übernehmen. Importierte Einträge werden gruppiert, sodass du den ganzen Stapel entfernen kannst.',
  },
  'gemini.import': { en: 'Import', de: 'Importieren' },
  'gemini.scraping': { en: 'Scraping…', de: 'Wird gelesen…' },
  'gemini.parse': { en: 'Parse pasted content', de: 'Eingefügten Inhalt verarbeiten' },
  'gemini.pastePlaceholder': {
    en: 'Paste the conversation text or saved page HTML here. Blank-line-separated blocks become prompts; <img> tags become images.',
    de: 'Füge hier den Gesprächstext oder gespeicherten Seiten-HTML ein. Durch Leerzeilen getrennte Blöcke werden zu Prompts; <img>-Tags werden zu Bildern.',
  },

  // Image entry editor
  'entry.figure': { en: 'Figure', de: 'Abbildung' },
  'entry.remove': { en: 'Remove', de: 'Entfernen' },
  'entry.prompt': { en: 'Prompt', de: 'Prompt' },
  'entry.highlightDiff': { en: '✦ Highlight diff', de: '✦ Unterschiede markieren' },
  'entry.clear': { en: 'Clear', de: 'Zurücksetzen' },
  'entry.promptPlaceholder': {
    en: 'The exact prompt used to generate this image…',
    de: 'Der genaue Prompt, mit dem dieses Bild erzeugt wurde…',
  },
  'entry.promptHint': {
    en: 'Wrap text in ==…== to highlight, or use the button to mark differences from the previous figure.',
    de: 'Setze Text in ==…==, um ihn hervorzuheben, oder nutze die Schaltfläche, um Unterschiede zur vorigen Abbildung zu markieren.',
  },
  'entry.preview': { en: 'Preview:', de: 'Vorschau:' },
  'entry.geminiLink': { en: 'Gemini chat link', de: 'Gemini-Chatlink' },
  'entry.chatgptLink': { en: 'ChatGPT chat link', de: 'ChatGPT-Chatlink' },
  'entry.contextImages': { en: 'Context images', de: 'Kontextbilder' },
  'entry.contextImagesHint': {
    en: '(optional — inputs to the prompt)',
    de: '(optional — Eingaben für den Prompt)',
  },
  'entry.notes': { en: 'Notes', de: 'Notizen' },
  'entry.optional': { en: '(optional)', de: '(optional)' },
  'entry.notesPlaceholder': {
    en: 'Observations shown beneath this figure…',
    de: 'Beobachtungen, die unter dieser Abbildung erscheinen…',
  },
  'entry.resultPlaceholder': {
    en: 'Result image — click, drop, or paste',
    de: 'Ergebnisbild — klicken, ablegen oder einfügen',
  },
  'entry.addContext': { en: '+ add', de: '+ neu' },
  'entry.dragReorder': { en: 'Drag to reorder', de: 'Zum Umsortieren ziehen' },

  // Rendered document (preview + PDF)
  'doc.untitled': { en: 'Untitled White Paper', de: 'White Paper ohne Titel' },
  'doc.anonymous': { en: 'Anonymous Student', de: 'Anonyme:r Studierende:r' },
  'doc.abstract': { en: 'Abstract', de: 'Zusammenfassung' },
  'doc.imageDoc': { en: 'Image Documentation', de: 'Bilddokumentation' },
  'doc.contextInputs': { en: 'Context inputs', de: 'Kontext-Eingaben' },
  'doc.prompt': { en: 'Prompt', de: 'Prompt' },
  'doc.figure': { en: 'Figure', de: 'Abbildung' },
  'doc.notes': { en: 'Notes', de: 'Notizen' },
  'doc.references': { en: 'References', de: 'Quellen' },
  'doc.viewGemini': { en: '◆ View in Gemini ↗', de: '◆ In Gemini ansehen ↗' },
  'doc.viewChatGPT': { en: '✦ View in ChatGPT ↗', de: '✦ In ChatGPT ansehen ↗' },
  'doc.refConversation': { en: 'conversation for Figure', de: 'Konversation zu Abbildung' },
} as const;

export type TKey = keyof typeof dict;
export type Translate = (key: TKey) => string;

const LS_KEY = 'whitepaperbuilder:lang:v1';

function detectInitial(): Lang {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'en' || saved === 'de') return saved;
    if (navigator.language?.toLowerCase().startsWith('de')) return 'de';
  } catch {
    // localStorage / navigator unavailable — fall through to default.
  }
  return 'en';
}

/** Translator usable outside React (e.g. when rendering the PDF imperatively). */
export function makeTranslator(lang: Lang): Translate {
  return (key: TKey) => dict[key][lang];
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectInitial);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, lang);
    } catch {
      // Ignore — persistence is best-effort.
    }
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: makeTranslator(lang) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
