// Stamps "page / total" footers onto a finished PDF.
//
// This exists because react-pdf's own page-number mechanism — a `fixed` Text
// with a `render` prop — forces a per-page relayout that corrupts coordinates
// on multi-page documents with images ("unsupported number: …") and aborts the
// whole export. Stamping the numbers onto the rendered PDF avoids that code
// path entirely and works for any page count.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Match the document's old footer look: Times 9pt, slate-400, centered, 28pt
// above the page bottom.
const FONT_SIZE = 9;
const BASELINE_Y = 30;
const COLOR = rgb(0x94 / 255, 0xa3 / 255, 0xb8 / 255);

export async function addPageNumbers(pdfBlob: Blob): Promise<Blob> {
  const doc = await PDFDocument.load(await pdfBlob.arrayBuffer());
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const label = `${i + 1} / ${pages.length}`;
    const width = font.widthOfTextAtSize(label, FONT_SIZE);
    page.drawText(label, {
      x: page.getWidth() / 2 - width / 2,
      y: BASELINE_Y,
      size: FONT_SIZE,
      font,
      color: COLOR,
    });
  });
  const bytes = await doc.save();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/pdf' });
}
