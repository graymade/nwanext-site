// Samples the card photo's scale every animation frame while the pointer enters and leaves a card.
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://localhost:3035';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
const card = p.locator('.feed .post:not(.post--lead)').first();
await card.scrollIntoViewIfNeeded();
await p.mouse.move(5, 5);
await p.waitForTimeout(600);
await p.evaluate(() => {
  const img = document.querySelector('.feed .post:not(.post--lead) img');
  window.__s = []; const t0 = performance.now();
  const tick = () => { window.__s.push([Math.round(performance.now() - t0), getComputedStyle(img).scale]); if (performance.now() - t0 < 1500) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const box = await card.boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + 100);
await p.waitForTimeout(750);
await p.mouse.move(5, 5);
await p.waitForTimeout(800);
const s = await p.evaluate(() => window.__s);
const pick = s.filter((_, i) => i % 4 === 0).map(([t, v]) => `${t}:${(+v || 1).toFixed(4)}`);
console.log(pick.join(' '));
await b.close();
