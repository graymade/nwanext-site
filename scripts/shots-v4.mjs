// Screenshots for the v4 pass (full page, 1440 and 390). Usage: node scripts/shots-v4.mjs [base]
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://localhost:3035';
const SHOTS = [
  ['home', '/'], ['about', '/about/'], ['connect', '/connect/'], ['newsletter', '/newsletter/'], ['submit', '/submit/'],
  ['guides', '/guides/'], ['guide-new-to-nwa', '/guides/new-to-nwa/'], ['cities', '/cities/'], ['city-fayetteville', '/cities/fayetteville/'],
  ['places', '/places/'], ['openings', '/openings/'], ['credits', '/credits/'], ['404', '/this-page-is-not-here/'],
];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const w of [1440, 390]) {
  const phone = w < 700;
  const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 844 : 900 }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone });
  for (const [name, p] of SHOTS) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      const shown = () => [...document.querySelectorAll('img')].filter((i) => i.getClientRects().length && !i.closest('dialog:not([open]), [popover]:not(:popover-open)'));
      for (let t = 0; t < 60 && shown().some((i) => !i.hasAttribute('data-in')); t++) await new Promise((r) => setTimeout(r, 100));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `qa/${name}-${w}-v4.png`, fullPage: true });
    console.log(`qa/${name}-${w}-v4.png`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
