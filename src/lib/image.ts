export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Extract the first image File from a clipboard or drag event's items/files. */
export function firstImageFile(
  source: DataTransfer | null | undefined,
): File | null {
  if (!source) return null;
  if (source.files && source.files.length) {
    for (const f of Array.from(source.files)) {
      if (f.type.startsWith('image/')) return f;
    }
  }
  if (source.items) {
    for (const item of Array.from(source.items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) return f;
      }
    }
  }
  return null;
}
