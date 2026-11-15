import fs from 'node:fs';
import { chromium } from 'playwright-core';
const [json, out, current] = process.argv.slice(2);
const V = JSON.parse(fs.readFileSync(json, 'utf8'));
const cur = fs.readFileSync(current, 'utf8');
const pick = (n) => cur.match(new RegExp(`const ${n} = '([^']+)'`))[1];
const NWA = pick('NWA'), NEXT = pick('NEXT');
const svg = (v, h) => `<svg viewBox="${v.viewBox}" style="height:${h}px;width:auto;display:block" role="img" aria-label="NWA Next">${v.words.map((w) => `<path d="${w.d}" fill="${w.role === 'a' && v.id === 'v6' ? '#C58A58' : w.role === 'a' && v.id === 'v2x' ? '#EFE7D8' : 'currentColor'}"/>`).join('')}${v.dot ? `<circle cx="${v.dot.cx}" cy="${v.dot.cy}" r="${v.dot.r}" fill="#C58A58"/>` : ''}</svg>`;
const old = (h) => `<svg viewBox="110 157 840 353" style="height:${h}px;width:auto;display:block"><path d="${NWA}" fill="currentColor" transform="translate(0 85)"/><path d="${NEXT}" fill="currentColor"/><circle cx="900" cy="487" r="13" fill="#C58A58"/></svg>`;
const row = (label, big, side, top) => `<section><p class="l">${label}</p><div class="cells"><div class="big">${big}</div><div class="side"><span class="cap">Sidebar</span>${side}<div class="fake"><i></i>Search</div></div><div class="top"><span class="cap">Phone top bar</span><div class="bar">${top}<b>All NWA</b></div></div></div></section>`;
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#19323A;color:#EFE7D8;font:500 15px/1.4 "Avenir Next",system-ui;padding:40px 48px;width:1504px}
h1{font-size:26px;margin:0 0 6px;font-weight:600} .sub{color:#b8b8ae;margin:0 0 28px}
section{display:grid;gap:10px;padding:22px 0;border-top:1px solid rgba(239,231,216,.14)}
.l{margin:0;font-weight:600;font-size:17px}
.cells{display:grid;grid-template-columns:1fr 280px 400px;gap:28px;align-items:center}
.big{color:#EFE7D8}
.side{background:color-mix(in srgb,#19323A 88%,#EFE7D8);border-radius:12px;padding:24px 20px;display:grid;gap:18px}
.fake{display:flex;gap:8px;align-items:center;height:40px;border-radius:8px;background:color-mix(in srgb,#19323A 60%,#0b171b);padding:0 12px;color:#aab}
.fake i{width:14px;height:14px;border:1.5px solid currentColor;border-radius:50%}
.top{display:grid;gap:8px}.bar{display:flex;align-items:center;justify-content:space-between;height:60px;padding:0 18px;background:#19323A;border:1px solid rgba(239,231,216,.14);border-radius:12px}
.bar b{font-weight:600;background:color-mix(in srgb,#19323A 88%,#EFE7D8);padding:10px 14px;border-radius:999px}
.cap{color:#9fa7a3;font-size:13px}
</style><h1>NWA Next wordmark, v4 options</h1><p class="sub">Avenir Next outlined to paths. Large, then at the sidebar and phone top bar sizes. The current stacked mark is first for reference.</p>
${row('0. Current stacked lockup', old(120), old(44), old(36))}
${V.map((v) => row(v.label, svg(v, 64), svg(v, 17), svg(v, 15))).join('')}`;
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await p.setContent(html);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log(out);
