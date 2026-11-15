// Quick headless screenshots for review. Usage: node scripts/shot.mjs outdir width path[,path...] [full=1] [suffix]
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const [out, wArg, paths, full = '1', suffix = ''] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:3035';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const w of wArg.split(',').map(Number)) {
  const phone = w < 700;
  const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 844 : 900 }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone });
  for (const p of paths.split(',')) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
      const shown = () => [...document.querySelectorAll('img')].filter((i) => i.getClientRects().length && !i.closest('dialog:not([open]), [popover]:not(:popover-open)'));
      for (let t = 0; t < 60 && shown().some((i) => !i.hasAttribute('data-in')); t++) await new Promise((r) => setTimeout(r, 100));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);
    const name = (p.replace(/[/?=&]+/g, '-').replace(/^-|-$/g, '') || 'home') + `-${w}${suffix}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: full === '1' });
    console.log(`${out}/${name}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
