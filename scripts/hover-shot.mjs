// Close-up screenshots of hover states. Usage: node scripts/hover-shot.mjs outdir
import { chromium } from 'playwright-core';
const out = process.argv[2] || 'qa';
const BASE = 'http://localhost:3035';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
for (const [name, path, sel, pad] of [
  ['hover-card', '/', '.feed .post:not(.post--lead)', 24],
  ['hover-row', '/events/', '.arow', 24],
  ['hover-city', '/cities/', '.ccard', 24],
  ['hover-pair', '/guides/', '.dgroup .pair', 40],
]) {
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const el = p.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 40));
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/${name}-v4.png`, clip: { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 } });
}
await b.close();
