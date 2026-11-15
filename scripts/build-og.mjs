// Builds public/open-graph-share.png (1200x630), the default share image: wordmark, the Instagram bio line, one sub line.
// Run from _Pocket: node scripts/build-og.mjs. Needs Avenir Next (macOS) and Chrome.
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const src = fs.readFileSync('components/Wordmark.tsx', 'utf8');
const paths = [...src.matchAll(/const (\w+) = '([^']+)'/g)].map((m) => m[2]);
const vb = src.match(/viewBox="([^"]+)"/)[1];
const html = `<html><body style="margin:0;width:1200px;height:630px;background:#19323A;font-family:'Avenir Next';color:#EFE7D8;position:relative;overflow:hidden">
<div style="position:absolute;left:0;top:0;bottom:0;width:14px;background:#C58A58"></div>
<svg viewBox="0 0 1200 630" style="position:absolute;inset:0" fill="none"><path d="M0 492 C 300 440, 520 560, 760 400 S 1100 200, 1200 290" stroke="#2C4F59" stroke-width="12"/><path d="M0 540 C 320 490, 560 600, 800 440 S 1120 260, 1200 340" stroke="#5f7a80" stroke-width="2"/></svg>
<div style="position:absolute;left:84px;top:120px">
<svg viewBox="${vb}" style="height:92px;display:block" fill="#EFE7D8">${paths.map((d) => `<path d="${d}"/>`).join('')}</svg>
<p style="margin:34px 0 0;font-size:46px;font-weight:500;letter-spacing:-0.015em;line-height:1.12;max-width:900px">What’s opening, closing, building, and changing across <b style="font-weight:700">Northwest Arkansas.</b></p>
<p style="margin:14px 0 0;font-size:26px;color:#a9b8b9">Things to do, new spots and local news, town by town.</p>
</div></body></html>`;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html); await p.waitForTimeout(300);
await p.screenshot({ path: 'public/open-graph-share.png' });
await b.close();
