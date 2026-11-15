import fs from 'node:fs';
import path from 'node:path';
import { absoluteUrl, getArticles, getSite, mediaInfo } from '@/lib/content';

export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// RSS also powers newsletter automation: Buttondown, Kit and Beehiiv can all send new items from a feed.
// Images point at the 1200px JPEG made by scripts/images.mjs (same path as the content uses).
export function GET() {
  const site = getSite();
  const items = getArticles().slice(0, 50).map((a) => {
    const img = a.showImage && a.image && mediaInfo(a.image) ? absoluteUrl(a.image) : '';
    const file = img && a.image ? path.join(process.cwd(), 'public', a.image) : '';
    const length = file && fs.existsSync(file) ? fs.statSync(file).size : 0;
    return `
    <item>
      <title>${esc(a.title)}</title>
      <link>${absoluteUrl(`/news/${a.slug}/`)}</link>
      <guid isPermaLink="true">${absoluteUrl(`/news/${a.slug}/`)}</guid>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <category>${esc(a.city)}</category>
      <category>${esc(a.category)}</category>${img ? `\n      <enclosure url="${img}" type="image/jpeg" length="${length}" />` : ''}
      <description><![CDATA[${img ? `<p><img src="${img}" alt="" width="1200" /></p>` : ''}${a.html}]]></description>
    </item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${site.url}</link>
    <description>${esc(site.description)}</description>
    <language>en-us</language>
    <atom:link href="${absoluteUrl('/feed.xml')}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
