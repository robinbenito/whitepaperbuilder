export type EntrySource = 'manual' | 'gemini' | 'chatgpt';

export interface ContextImage {
  id: string;
  imageUrl: string;
  fileName: string;
}

export interface ImageEntry {
  id: string;
  imageUrl: string; // data URL (base64) so it survives PDF embedding
  fileName: string;
  prompt: string;
  geminiLink: string;
  chatgptLink: string;
  /** Optional free-text notes shown beneath the figure. */
  notes: string;
  /** Optional reference images that were fed into the model as prompt context. */
  contextImages: ContextImage[];
  /** Which import group produced this entry (so a whole group can be removed). */
  groupId?: string;
}

export interface ImportGroup {
  id: string;
  source: EntrySource;
  /** The chat share link this group was imported from. */
  link: string;
  label: string;
}

export interface Submission {
  title: string;
  studentName: string;
  course: string;
  date: string;
  abstract: string;
  synthesis: string; // Markdown body
  entries: ImageEntry[];
  groups: ImportGroup[];
}

export function emptyEntry(groupId?: string): ImageEntry {
  return {
    id: crypto.randomUUID(),
    imageUrl: '',
    fileName: '',
    prompt: '',
    geminiLink: '',
    chatgptLink: '',
    notes: '',
    contextImages: [],
    groupId,
  };
}

export function emptySubmission(): Submission {
  return {
    title: 'Exploring Latent Space: A Study in Generative Imagery',
    studentName: '',
    course: 'Generative Image Synthesis',
    date: new Date().toISOString().slice(0, 10),
    abstract:
      'This white paper documents an iterative exploration of text-to-image generation, tracing prompt engineering decisions and their visual outcomes across multiple model platforms.',
    synthesis: `## 1. Methodology

Describe your approach to prompt construction, the models you compared, and how you iterated.

## 2. Findings

- Observation one about how phrasing affected composition.
- Observation two about lighting and style descriptors.

## 3. Reflection

> What surprised you most about the relationship between language and image?
`,
    entries: [emptyEntry()],
    groups: [],
  };
}
