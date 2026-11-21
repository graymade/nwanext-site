// Turns published @nwa_next Instagram posts into website stories. The live post is the source of truth: if it's on the account,
// it was published. Input: a JSON list of posts [{ code, date, caption, alt }] (from a feed read). Run from _Pocket:
//   node scripts/import-instagram.mjs posts.json [--dry-run]
// For each post that isn't on the site yet (matched by its Instagram shortcode), it:
//   - parses the caption like the receipt sync does (headline, summary, city, topic, status, credits, sources, hashtags)
//   - links @handles (in the body, the sources and the credits) to their Instagram profiles, and keeps any web links
//   - downloads the post image from the post's public embed page into media/posts/<slug>.jpg (scripts/images.mjs sizes it)
//   - writes content/articles/<date>-<slug>.md
// It never overwrites an existing story: once on the site, the CMS copy wins. Same rules as INSTAGRAM_TO_WEBSITE.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTICLES = path.join(ROOT, 'content/articles'), MEDIA = path.join(ROOT, 'media/posts');
const CLI = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const CITIES = readJson(path.join(ROOT, 'content/cities.json'), []).map((c) => c.name);
const HANDLES = readJson(path.join(ROOT, 'content/handles.json'), {});
const NEARBY = ['Fort Smith', 'Harrison', 'Joplin', 'Tulsa', 'Little Rock'];

// ---------- caption parsing (same rules as scripts/sync-from-newsroom.mjs)
function parseCaption(caption = '') {
  const tags = [], sources = [], credits = [], body = [];
  for (const raw of caption.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (/^(#[\w]+\s*)+$/.test(line)) { tags.push(...line.match(/#\w+/g).map((t) => t.slice(1))); continue; }
    const s = line.match(/^(?:Sources?|First (?:spotted|reported) by)\s*:?\s*(.+)$/i);
    if (s) { sources.push(...s[1].replace(/^first (?:reported|spotted) by\s+/i, '').split(/[;,](?![^()]*\))/).map((x) => x.trim()).filter(Boolean)); continue; }
    if (/^(Photo|Photos|Image|Images|Logo|Art|Artwork|Event art|Poster|Map|Video|Pictured)\b[^:]*:/i.test(line) || /^Photo by\b/i.test(line)) { credits.push(line); continue; }
    if (/^(Status|Verified|Last verified):/i.test(line)) continue;
    body.push(raw);
  }
  return { text: body.join('\n').replace(/\n{3,}/g, '\n\n').trim(), tags, sourceNames: sources, credits };
}
const plainHandles = (t) => t.replace(/(^|[\s(’'])@([A-Za-z0-9_.]*[A-Za-z0-9_])/g, (_, pre, h) => `${pre}${HANDLES[h.toLowerCase()] || h}`);
const cleanTitle = (s) => s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]️?/gu, '').replace(/^(NOW OPEN|NEW|JUST IN|UPDATE|SAVE THE DATE)[:!]\s*/i, '').replace(/\s+/g, ' ').trim();
function firstSentence(t) {
  const para = (t.split(/\n\s*\n/).find((l) => l.trim()) || '').replace(/\s+/g, ' ').trim();
  const re = /[.!?](?=\s+[A-Z“"])/g; let m;
  while ((m = re.exec(para))) {
    const before = para.slice(Math.max(0, m.index - 3), m.index);
    if (/(^|\s)[A-Z]$/.test(before) || /[A-Z]\.[A-Z]$/.test(before) || /\b(St|Dr|Mr|Ms|Mrs|Ave|Rd|Sept|Oct|Nov|Dec|Jan|Feb|Aug|Inc|Co)$/.test(para.slice(0, m.index))) continue;
    return para.slice(0, m.index + 1);
  }
  return para;
}
function trimTitle(s, max = 90) {
  s = cleanTitle(s).replace(/[.]$/, '').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max), at = Math.max(...[':', ',', ' with ', ' for ', ' in ', ' on ', ' at '].map((x) => cut.lastIndexOf(x)));
  return (at > 30 ? cut.slice(0, at) : cut.slice(0, cut.lastIndexOf(' '))).replace(/[,;:]+$/, '').replace(/\s+(in|on|at|to|for|with|and|the|a)$/i, '').trim();
}
function summarize(t, max = 220) {
  const paras = t.split(/\n\s*\n/).map((l) => plainHandles(l.replace(/\s+/g, ' ').trim())).filter((l) => l && !/^[📍🗓🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛🎟📲🔗]/u.test(l));
  const para = paras[1] || paras[0] || '';
  return para.length <= max ? para : para.slice(0, para.slice(0, max).lastIndexOf(' ')).replace(/[,;:]$/, '') + '…';
}
const ig = (h) => `https://www.instagram.com/${h}/`;
const linkHandles = (t) => t.replace(/(^|[\s(])@([A-Za-z0-9_.]*[A-Za-z0-9_])/g, (_, pre, h) => `${pre}[@${h}](${ig(h)})`);
const CATEGORY_MAP = [
  [/\b(festival|fest|fair|market|parade|celebration|gala|fan zone|crawl|funday|meetup|first friday|tree lighting|trick or treat|halloween|christmas|holiday|lights)\b/i, 'Events'],
  [/\b(music|concert|band|vinyl|record fair|dj|tour|film|films|screening|art|arts|museum|exhibit(ion)?|theat(er|re)|comedy|gallery|pottery)\b/i, 'Arts & Music'],
  [/\b(store|shop|retail|business|startup|hotel|boutique)\b/i, 'Business'],
  [/\b(restaurant|food|caf[eé]|coffee|bar|brew(ing|ery)?|eats?|pizza|tacos?|bakery|dining|kitchen|ribhouse|chick-fil-a|mediterranean|dinner|lunch|brunch|breakfast|burger|bbq|donuts?|crepes?|matcha|ramen|sushi)\b/i, 'Food & Drink'],
  [/\b(trails?|parks?|bike|greenway|outdoors?|lake|river|nature|garden)\b/i, 'Outdoors'],
  [/\b(construction|development|expansion|groundbreaking|repaving|sidewalk|road work|housing|proposed|apartments?)\b/i, 'Development'],
];
const categorize = (title, text) => { for (const hay of [title, text]) for (const [re, name] of CATEGORY_MAP) if (re.test(hay)) return name; return 'News'; };
function statusVerb(title, text) {
  const t = title.toLowerCase();
  if (!/\b(open|opens|opened|opening|reopen|coming back|clos|construction|proposed|build|expan|moves?|moving|renamed|new location|work begins|repaving)/.test(t)) return /\b(now open|is open|has opened|opened|is officially open)\b/i.test(text) ? 'opening' : '';
  if (/\b(reopen(s|ing)?|coming back)\b/.test(t)) return 'opening';
  if (/\b(closing|closes|closed|final day|last day|shutting down)\b/.test(t)) return 'closing';
  if (/\b(construction|groundbreaking|expansion|expanding|proposed|will build|under way|underway|breaks ground|work begins|repaving)\b/.test(t)) return 'building';
  if (/\b(now open|is open|opened|opens|opening|grand opening|debuts?|new location|launch(es|ed)?)\b/.test(t)) return 'opening';
  if (/\b(moves?|moving|renamed|rebrand|new owner|changes?|returns?)\b/.test(t)) return 'changing';
  return '';
}
const VENUE_CITY = [[/momentary|crystal bridges|r[øo]de house|downtown bentonville|8th street market/i, 'Bentonville'], [/walton arts center|botanical garden of the ozarks|dickson street|university of arkansas|razorback|south yard/i, 'Fayetteville'], [/jones center|arts center of the ozarks|luther george/i, 'Springdale'], [/pinnacle hills|walmart amp/i, 'Rogers']];
function findCity(text) {
  // The 📍 line names the place; otherwise the town named first in the caption wins.
  const pin = (text.match(/^📍(.*)$/mu) || [])[1] || '';
  for (const hay of [pin, text]) {
    const hits = CITIES.map((c) => ({ c, i: hay.search(new RegExp(`\\b${c}\\b`, 'i')) })).filter((h) => h.i >= 0).sort((a, b) => a.i - b.i);
    if (hits.length) return hay === pin ? hits[hits.length - 1].c : hits[0].c;
  }
  for (const [re, c] of VENUE_CITY) if (re.test(text)) return c;
  for (const c of NEARBY) if (new RegExp(`\\b${c}\\b`).test(text)) return c;
  return 'Northwest Arkansas';
}
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/^(.{0,72})(-.*)?$/, (m, a, b) => (b && a.length > 30 ? a : m.slice(0, 72))).replace(/-(in|on|at|to|for|with|and|the|a|of)$/, '');
// whole words only, about 72 characters at most
// "@tristar.3" -> { name: "Tristar", url: instagram }, "Walton Family Foundation (Luther George Park)" -> { name }
const sourceOf = (s) => { const h = s.match(/^@([A-Za-z0-9_.]*[A-Za-z0-9_])$/); if (h) return { name: HANDLES[h[1].toLowerCase()] || `@${h[1]}`, url: ig(h[1]) }; const u = s.match(/(https?:\/\/\S+)/); return u ? { name: s.replace(u[1], '').replace(/[:\s]+$/, '') || u[1], url: u[1] } : { name: plainHandles(s) }; };
const creditText = (l) => plainHandles(l);

// ---------- the post image, from the public embed page (no login, no API)
async function embed(code) {
  const res = await fetch(`https://www.instagram.com/p/${code}/embed/captioned/`, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) return {};
  const html = await res.text();
  const src = (html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/) || [])[1]?.replace(/&amp;/g, '&');
  const cap = (html.match(/<div class="Caption">([\s\S]*?)(?:<div class="CaptionComments">|<\/div>)/) || [])[1];
  const text = cap ? cap.replace(/<br\s*\/?>/g, '\n').replace(/<a [^>]*class="CaptionUsername"[^>]*>[^<]*<\/a>/, '').replace(/<[^>]+>/g, '').replace(/&#064;/g, '@').replace(/&amp;/g, '&').replace(/&#039;|&#x27;/g, '’').replace(/&quot;/g, '"').replace(/^\s+/, '').trim() : '';
  return { src, caption: text };
}

// The Instagram shortcodes already on the site.
// Posts set aside as not news (content/instagram-skip.json) count as handled, so they are never imported again.
export const existingCodes = () => new Set([...readJson(path.join(ROOT, 'content/instagram-skip.json'), []).map((x) => x.code), ...fs.readdirSync(ARTICLES).flatMap((f) => { const d = matter(fs.readFileSync(path.join(ARTICLES, f), 'utf8')).data; return [d.instagram, d.instagram_also].filter(Boolean).map((u) => (String(u).match(/\/(?:p|reel)\/([\w-]+)/) || [])[1]); })]);

// Imports the posts that aren't on the site yet. Returns the article file names it wrote. New stories get needs_edit: true,
// so the editing step (headline, summary, source links) knows what to pick up.
export async function importPosts(posts, { dry = false, log = console.log } = {}) {
  const DRY = dry;
const existing = existingCodes();
  const names = new Set(fs.readdirSync(ARTICLES));
  const added = [], skipped = [], failed = [];
  for (const p of [...posts].reverse()) { // oldest first, so a later post with the same headline gets the suffix
    if (existing.has(p.code)) { skipped.push(p.code); continue; }
    let caption = p.caption || '', img = '';
    try { const e = await embed(p.code); img = e.src || ''; if (!caption && e.caption) caption = e.caption; } catch { /* the post still imports without a picture */ }
    await new Promise((r) => setTimeout(r, 900)); // gentle: about one request a second
    if (!caption) { failed.push(`${p.code} (no caption)`); continue; }
    caption = caption.replace(/[<>]/g, ''); // captions are text: no raw HTML can reach the Markdown (or the RSS feed built from it)
    const { text, tags, sourceNames, credits } = parseCaption(caption);
    const title = trimTitle(plainHandles(firstSentence(text) || 'NWA Next update'));
    const date = new Date(p.date).toISOString();
    let slug = slugify(title) || p.code.toLowerCase();
    if ([...names].some((n) => n.endsWith(`-${slug}.md`))) slug = `${slug}-${p.code.toLowerCase().slice(0, 6)}`;
    let image;
    if (img && !DRY) {
      try { const r = await fetch(img); if (r.ok) { fs.writeFileSync(path.join(MEDIA, `${slug}.jpg`), Buffer.from(await r.arrayBuffer())); image = `/media/posts/${slug}.jpg`; } } catch { /* no picture */ }
    } else if (img) image = `/media/posts/${slug}.jpg`;
    const sources = sourceNames.map(sourceOf);
    const fm = {
      title, date, city: findCity(`${title}\n${text}`), category: categorize(title, text), status: statusVerb(title, text), summary: summarize(text),
      instagram: `https://www.instagram.com/p/${p.code}/`, format: 'post', image, graphic: image,
      image_alt: p.alt || (image ? `NWA Next Instagram post: ${title}` : undefined), show_image: !!image,
      credits: credits.map(creditText).filter((l) => !/^(Music|Audio)\b/i.test(l)), sources, tags, featured: false, synced_from: `instagram:${p.code}`, needs_edit: true,
    };
    for (const k of Object.keys(fm)) if (fm[k] === undefined || fm[k] === '' || (Array.isArray(fm[k]) && !fm[k].length && k !== 'tags')) delete fm[k];
    const name = `${date.slice(0, 10)}-${slug}.md`;
    if (!DRY) fs.writeFileSync(path.join(ARTICLES, name), matter.stringify(`${linkHandles(text)}\n`, fm));
    names.add(name); existing.add(p.code); added.push(`${name}${image ? '' : ' (no picture)'}`);
  }
    log(`Instagram import: ${added.length} new, ${skipped.length} already on site, ${failed.length} failed.`);
  for (const a of added) log(`  + ${a}`);
  for (const f of failed) log(`  ! ${f}`);
  return added.map((a) => a.replace(/ \(no picture\)$/, ''));
}

if (CLI) {
  const input = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!input) { console.error('Usage: node scripts/import-instagram.mjs posts.json [--dry-run]'); process.exit(1); }
  await importPosts(readJson(input, []), { dry: process.argv.includes('--dry-run') });
}
