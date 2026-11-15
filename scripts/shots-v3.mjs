// Before/after screenshots for the v3 polish pass. Usage: node scripts/shots-v3.mjs before|after [base]
import { chromium } from 'playwright-core';
const [tag = 'after', BASE = 'http://localhost:3035'] = process.argv.slice(2);
const EVENT = '/news/the-momentary-brings-cure-for-paranoia-to-bentonville-on-tuesday-sept/';
const SHOTS = [
  ['home', '/', [1440, 390]],
  ['story-event', EVENT, [1440, 390]],
  ['events', '/events/', [1440, 390]],
  ['city-fayetteville', '/cities/fayetteville/', [1440, 390]],
  ['calendar', '/calendar/', [1440, 390]],
];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [name, p, widths] of SHOTS) {
  for (const w of widths) {
    const phone = w < 700;
    const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 844 : 900 }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone });
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      const shown = () => [...document.querySelectorAll('img')].filter((i) => i.getClientRects().length && !i.closest('dialog:not([open]), [popover]:not(:popover-open)'));
      for (let t = 0; t < 60 && shown().some((i) => !i.hasAttribute('data-in')); t++) await new Promise((r) => setTimeout(r, 100));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `qa/${name}-${w}-v3-${tag}.png`, fullPage: true });
    console.log(`qa/${name}-${w}-v3-${tag}.png`);
    await ctx.close();
  }
}
await browser.close();
