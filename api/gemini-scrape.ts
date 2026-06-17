// Vercel serverless function: scrapes a Gemini share link with headless Chromium.
//
// Deploy notes:
//  - Uses puppeteer-core + @sparticuz/chromium so the function stays under
//    Vercel's serverless size limit (full puppeteer/playwright Chromium is too big).
//  - Raise maxDuration (see vercel.json) so a cold Chromium launch + JS render fits.
//  - Gemini share markup changes over time; the selectors below are best-effort and
//    the client gracefully falls back to manual paste when this returns no pairs.

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ScrapedPair {
  prompt: string;
  imageUrl: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = typeof req.query.url === 'string' ? req.query.url : '';
  if (!url || !/^https?:\/\/(g\.co|gemini\.google\.com|.*\.google\.com)/.test(url)) {
    return res.status(400).json({ error: 'Provide a valid Gemini share URL.' });
  }

  let browser: import('puppeteer-core').Browser | null = null;
  try {
    // Dynamic imports keep the cold-start light and avoid bundling when unused.
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: { width: 1280, height: 1600 },
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45_000 });
    // Give the conversation a moment to hydrate.
    await page.waitForSelector('img', { timeout: 15_000 }).catch(() => {});

    const pairs: ScrapedPair[] = await page.evaluate(() => {
      const out: { prompt: string; imageUrl: string }[] = [];
      // Best-effort: associate each generated image with the nearest preceding text.
      const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
        const src = img.getAttribute('src') ?? '';
        return src.startsWith('http') && img.naturalWidth > 128;
      });
      for (const img of imgs) {
        const container = img.closest('[data-test-id], article, .conversation-container') || img.parentElement;
        const text = (container?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 600);
        out.push({ prompt: text, imageUrl: img.getAttribute('src') ?? '' });
      }
      return out;
    });

    return res.status(200).json({ pairs });
  } catch (e) {
    return res
      .status(200)
      .json({ pairs: [], error: e instanceof Error ? e.message : 'Scrape failed' });
  } finally {
    if (browser) await browser.close();
  }
}
