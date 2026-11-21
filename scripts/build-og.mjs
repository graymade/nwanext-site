// Builds public/open-graph-share.png (1200x630), the default share image: the wordmark, the tagline and the badge stone.
// Run from _Pocket: node scripts/build-og.mjs. Needs Chrome. Font: Bricolage Grotesque (OFL), scripts/assets/.
import fs from 'node:fs';
import { chromium } from 'playwright-core';
const M = JSON.parse(fs.readFileSync('lib/brand/marks.json', 'utf8'));
const font = fs.readFileSync('scripts/assets/bricolagegrotesque.ttf').toString('base64');
const H = M.horizontal, BD = M.badge;
const html = `<html><head><style>@font-face{font-family:B;src:url(data:font/ttf;base64,${font});font-weight:200 800;font-stretch:75% 100%}
body{margin:0;width:1200px;height:630px;background:#F2EDE3;color:#16140F;font-family:B;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased}</style></head><body>
<svg viewBox="${H.vb.join(' ')}" style="position:absolute;left:72px;top:78px;height:96px"><path fill="#16140F" d="${H.nwa}"/><path fill="#C9482A" d="${H.next}"/></svg>
<p style="position:absolute;left:72px;top:232px;margin:0;width:700px;font-size:64px;font-weight:800;letter-spacing:-.03em;line-height:.98">If it’s worth leaving the house for, it’s here<span style="margin-left:.06em">.</span></p>
<p style="position:absolute;left:72px;bottom:70px;margin:0;font-size:30px;font-weight:600;color:#6E685C">New eats, events &amp; openings across Northwest Arkansas.</p>
<svg viewBox="${BD.vb.join(' ')}" style="position:absolute;right:58px;top:150px;width:330px;rotate:8deg"><path fill="#C9482A" d="${BD.stone}"/><path fill="#F2EDE3" d="${BD.letters}"/></svg>
</body></html>`;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
await p.screenshot({ path: 'public/open-graph-share.png' });
await b.close();
console.log('wrote public/open-graph-share.png');
