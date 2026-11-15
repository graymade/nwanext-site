// Hover diagnosis: for each hover target, which properties change without a transition (snaps),
// whether any box moves, and whether the zoomed image gets a compositing layer only during the move.
// Usage: node scripts/hover-diag.mjs [base]
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://localhost:3035';
const PROPS = ['color', 'background-color', 'text-decoration-color', 'box-shadow', 'opacity', 'scale', 'transform', 'translate', 'border-color', 'font-weight', 'padding-inline-start', 'outline-color', 'rotate'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const TARGETS = [
  ['/', '.feed .post:not(.post--lead)'], ['/', '.feed .post--lead'], ['/', '.ecard__link'], ['/', '.spot'], ['/', '.sidenav__link:not([aria-current])'],
  ['/', '.side__search'], ['/', '.see-all'], ['/', '.sitemap__col a'], ['/', '.seg__btn:not([aria-checked="true"])'], ['/', '.fbtn'], ['/', '.button--quiet'], ['/', '.iconbtn--line:not(:disabled)'], ['/', '.brand'],
  ['/events/', '.arow'], ['/events/', '.day:not(:disabled)'], ['/cities/', '.city-row'], ['/places/', '.place-row'], ['/guides/', '.pair'], ['/connect/', '.choice .link'],
  ['/news/the-momentary-brings-cure-for-paranoia-to-bentonville-on-tuesday-sept/', '.nextstory__card'], ['/news/the-momentary-brings-cure-for-paranoia-to-bentonville-on-tuesday-sept/', '.row'],
  ['/calendar/', '.mev'], ['/calendar/', '.mcell__num'],
];
let cur = '';
for (const [p, sel] of TARGETS) {
  if (p !== cur) { await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(800); cur = p; }
  const el = page.locator(sel).first();
  if (!(await el.count())) { console.log(`${sel}: not found on ${p}`); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(700);
  const snap = () => el.evaluate((root, props) => {
    const nodes = [root, ...root.querySelectorAll('*')].slice(0, 40);
    return nodes.map((n) => { const cs = getComputedStyle(n); const r = n.getBoundingClientRect(); return { tag: n.tagName.toLowerCase() + '.' + String(n.className?.baseVal ?? n.className).split(' ')[0], tp: cs.transitionProperty, td: cs.transitionDuration, box: [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100), layout: [n.offsetLeft, n.offsetTop, n.offsetWidth, n.offsetHeight], s: Object.fromEntries(props.map((k) => [k, cs.getPropertyValue(k)])) }; });
  }, PROPS);
  const before = await snap();
  const box = await el.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 60));
  await page.waitForTimeout(20);
  const early = await snap();
  await page.waitForTimeout(1000);
  const after = await snap();
  const snaps = [], moved = [], noTrans = [];
  before.forEach((b, i) => {
    const a = after[i], e = early[i];
    if (!a) return;
    if (JSON.stringify(b.layout) !== JSON.stringify(a.layout)) moved.push(`${b.tag} ${b.layout}->${a.layout}`);
    for (const k of PROPS) {
      if (b.s[k] === a.s[k]) continue;
      const tp = b.tp.split(',').map((s) => s.trim());
      const covered = tp.includes('all') || tp.includes(k) || (k === 'border-color' && tp.some((t) => t.startsWith('border')));
      // Changed fully within 20ms = snapped.
      const instant = e.s[k] === a.s[k];
      if (!covered) noTrans.push(`${b.tag} ${k}: ${b.s[k]} -> ${a.s[k]}`);
      else if (instant) snaps.push(`${b.tag} ${k} (instant)`);
    }
  });
  console.log(`${p} ${sel}\n  untransitioned: ${noTrans.join(' | ') || 'none'}\n  snapped: ${snaps.join(' | ') || 'none'}\n  layout moved: ${moved.join(' | ') || 'none'}\n  transitions: ${[...new Set(before.filter((b) => b.tp !== 'all' || b.td !== '0s').map((b) => `${b.tag}[${b.tp} ${b.td}]`))].slice(0, 6).join(' ')}`);
}
// Layer churn while a feed card zooms.
const cdp = await ctx.newCDPSession(page);
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await cdp.send('LayerTree.enable');
let layers = 0;
cdp.on('LayerTree.layerTreeDidChange', (e) => { if (e.layers) layers = e.layers.length; });
const card = page.locator('.feed .post:not(.post--lead)').first();
await card.scrollIntoViewIfNeeded();
await page.mouse.move(5, 5);
await page.waitForTimeout(600);
const l0 = layers;
const b = await card.boundingBox();
await page.mouse.move(b.x + b.width / 2, b.y + 100);
const seq = [];
for (let i = 0; i < 12; i++) { await page.waitForTimeout(60); seq.push(layers); }
await page.waitForTimeout(600);
const l1 = layers;
await page.mouse.move(5, 5);
for (let i = 0; i < 12; i++) { await page.waitForTimeout(60); seq.push(layers); }
await page.waitForTimeout(600);
console.log(`layers idle:${l0} during-hover:${seq.join(',')} hovered-settled:${l1} after:${layers}`);
await browser.close();
