export interface ImageEntry {
  id: string;
  imageUrl: string; // data URL (base64) so it survives PDF embedding
  fileName: string;
  prompt: string;
  geminiLink: string;
  chatgptLink: string;
}

export interface Submission {
  title: string;
  studentName: string;
  course: string;
  date: string;
  abstract: string;
  synthesis: string; // Markdown body
  entries: ImageEntry[];
}

export function emptyEntry(): ImageEntry {
  return {
    id: crypto.randomUUID(),
    imageUrl: '',
    fileName: '',
    prompt: '',
    geminiLink: '',
    chatgptLink: '',
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
  };
}
