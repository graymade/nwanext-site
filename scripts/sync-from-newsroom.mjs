#!/usr/bin/env node
// Sync published NWA Next Instagram posts into website articles.
//
// Reads verified publication receipts (read-only). A receipt exists only after a post
// passed QC, got Sam's exact approval and was confirmed live on Instagram, so the
// website never shows anything that has not already been approved and published.
//
// Rules:
// - Never writes outside this website folder. Never modifies receipts or packages.
// - Never overwrites an existing article. Once synced, the CMS copy is the source of
//   truth, so edits made in /admin are safe.
// - Images: Sam's standing direction (2026-11-01) allows sourced images on the site with a
//   small credit naming the source. The sync prefers the original source photo over the
//   Instagram graphic (which has the headline baked in) and keeps the caption's credit lines.
//   Anything whose rights record says not to reuse it is hidden (show_image: false).
//
// Usage: node scripts/sync-from-newsroom.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
// --refresh-media: re-pick image fields on articles the sync created, leaving every other field alone.
const REFRESH_MEDIA = process.argv.includes('--refresh-media');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/sync.config.json'), 'utf8'));
const expand = (p) => (p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : path.resolve(ROOT, p));

const ARTICLES = path.join(ROOT, 'content/articles');
const MEDIA = path.join(ROOT, 'media/posts');
// Runtime root: package sources.json files give photo paths relative to it.
const RUNTIME_ROOT = expand(config.runtimeRoot || '~/.hermes/workspace/nwa-next-live-runtime');
// Every city and town in content/cities.json (edit the list in the CMS). Falls back to the original five.
const CITIES = (readJsonSafeEarly(path.join(ROOT, 'content/cities.json')) || []).map((c) => c.name);
if (!CITIES.length) CITIES.push('Bentonville', 'Rogers', 'Springdale', 'Fayetteville', 'Farmington');
function readJsonSafeEarly(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } }
const NEARBY = ['Siloam Springs', 'Lowell', 'Bella Vista', 'Cave Springs', 'Prairie Grove', 'Eureka Springs'];
const HANDLES = readJsonSafe(path.join(ROOT, 'content/handles.json')) || {};
function readJsonSafe(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } }

const readJson = (f) => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
};

// ---------- existing articles (dedupe by Instagram permalink) ----------
const existing = new Map();
const existingStories = new Map();
// Same story published as a post and a Reel shares one key.
function storyKeyOf(id) {
  return String(id || '').split(':')[0].replace(/-(reel|motion|static)(-v\d+)?$/, '').replace(/^nwa-(reel|static)-\d{4}-\d{2}-\d{2}-(\d{2}-)?/, '');
}
for (const f of fs.readdirSync(ARTICLES).filter((f) => f.endsWith('.md'))) {
  const { data } = matter(fs.readFileSync(path.join(ARTICLES, f), 'utf8'));
  if (data.instagram) existing.set(shortcode(data.instagram), f);
  if (data.instagram_also) existing.set(shortcode(data.instagram_also), f);
  if (data.story_id) existingStories.set(storyKeyOf(data.story_id), f);
}

function shortcode(url = '') {
  const m = String(url).match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/);
  return m ? m[1] : url;
}

// ---------- package index: story_id -> package dirs ----------
const pkgIndex = new Map();
function indexPackages(dir, depth = 0) {
  if (depth > 6 || !fs.existsSync(dir)) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'evidence', 'assets', 'render', 'qa'].includes(e.name)) continue;
      indexPackages(p, depth + 1);
    } else if (['publish-packet.json', 'canonical-story.json', 'review-package.json'].includes(e.name)) {
      const d = readJson(p);
      if (!d) continue;
      const ids = [d.story_id, d.canonical_story?.story_id, d.story_version_id].filter(Boolean);
      for (const id of ids) {
        const key = String(id).split(':')[0];
        if (!pkgIndex.has(key)) pkgIndex.set(key, new Set());
        pkgIndex.get(key).add(dir);
      }
    }
  }
}
for (const root of config.packageRoots) indexPackages(expand(root));

// ---------- receipts ----------
const receipts = [];
for (const dirRaw of config.receiptDirs) {
  const dir = expand(dirRaw);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const r = readJson(path.join(dir, f));
    if (!r || r.verified !== true) continue;
    const permalink = r.live_readback?.permalink || r.permalink;
    if (!permalink) continue;
    receipts.push({ file: f, receipt: r, permalink });
  }
}

// Same Instagram post can appear in canonical and runtime receipt folders.
const byCode = new Map();
for (const item of receipts) {
  const code = shortcode(item.permalink);
  if (!byCode.has(code)) byCode.set(code, item);
}

// ---------- helpers ----------
function packageDirsFor(r) {
  const dirs = new Set();
  for (const [k, v] of Object.entries(r)) {
    if (typeof v === 'string' && /(_path|_file)$/.test(k) && v.startsWith('/') && fs.existsSync(v)) {
      dirs.add(path.dirname(v));
    }
  }
  const id = String(r.story_id || '').split(':')[0];
  for (const d of pkgIndex.get(id) || []) dirs.add(d);
  return [...dirs];
}

function findInPackages(dirs, names) {
  for (const d of dirs) for (const n of names) {
    const p = path.join(d, n);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function storyMeta(dirs) {
  const meta = {};
  for (const d of dirs) {
    for (const n of ['publish-packet.json', 'canonical-story.json', 'review-package.json', 'sources.json']) {
      const j = readJson(path.join(d, n));
      if (!j) continue;
      const cs = j.canonical_story || j;
      meta.headline ||= cs.public_headline || j.public_headline || j.headline || cs.title;
      meta.city ||= cs.city || j.city;
      meta.category ||= j.category || cs.category;
      meta.eventDate ||= cs.occurrence_date || cs.event_date || j.occurrence_date || j.date;
      meta.whyItMatters ||= cs.why_it_matters;
      const srcs = Array.isArray(j.sources) ? j.sources : Array.isArray(j) ? j : null;
      if (srcs && !meta.sources) {
        meta.sources = srcs
          .filter((s) => s && s.url && /^https?:/.test(s.url))
          .map((s) => ({ name: s.publisher || s.name || s.source || hostname(s.url), url: s.url }));
      }
    }
  }
  return meta;
}

function hostname(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; }
}

// Explicit "don't reuse" language anywhere in the rights record hides the image.
function reuseRestricted(dirs, r) {
  const texts = [JSON.stringify(r.rights_basis || ''), JSON.stringify(r.image_licenses || '')];
  for (const d of dirs) {
    const p = path.join(d, 'rights-record.json');
    if (fs.existsSync(p)) texts.push(fs.readFileSync(p, 'utf8').slice(0, 20000));
  }
  return /no reuse|not for reuse|do not reuse|may not be reused|"explicit_source_restriction_found":\s*true/i.test(texts.join(' '));
}

const IMG = /\.(jpe?g|png|webp)$/i;
const NOT_PHOTO = /(^post[.-]|phone-preview|profile|preview|readback|transport|qa-|contact|logo|wordmark|avatar|screenshot|render|\.svg$)/i;

// The original photo or artwork behind the post, so the site can show it without the baked-in headline.
function findSourcePhoto(dirs) {
  // First choice: the photo or artwork the package's sources.json names (its local_path), never the logo.
  for (const d of dirs) {
    const src = readJson(path.join(d, 'sources.json'));
    if (!src) continue;
    for (const key of ['photo', 'artwork', 'image', 'background']) {
      const ref = src[key]?.local_path;
      if (typeof ref !== 'string' || !IMG.test(ref)) continue;
      const tries = path.isAbsolute(ref) ? [ref] : [path.join(d, ref), path.join(RUNTIME_ROOT, ref)];
      const hit = tries.find((p) => fs.existsSync(p));
      if (hit) return hit;
    }
  }
  const candidates = [];
  for (const d of dirs) {
    const rr = readJson(path.join(d, 'rights-record.json'));
    if (rr) {
      const refs = [];
      (function walk(o) {
        if (!o || typeof o !== 'object') return;
        for (const [k, v] of Object.entries(o)) {
          if (typeof v === 'string' && /^(file|asset|local_file|original_file|path)$/.test(k) && IMG.test(v)) refs.push(v);
          else if (typeof v === 'object') walk(v);
        }
      })(rr);
      for (const ref of refs) {
        const p = path.isAbsolute(ref) ? ref : path.join(d, ref);
        if (fs.existsSync(p) && !NOT_PHOTO.test(path.basename(p))) candidates.push(p);
      }
    }
    for (const sub of ['assets', '.']) {
      const dir = path.join(d, sub);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) if (IMG.test(f) && !NOT_PHOTO.test(f)) candidates.push(path.join(dir, f));
    }
  }
  // Largest file is usually the real photo rather than a thumbnail.
  const sized = [...new Set(candidates)].map((p) => ({ p, size: fs.statSync(p).size })).filter((x) => x.size > 40_000);
  sized.sort((a, b) => b.size - a.size);
  return sized[0]?.p || null;
}

// "Photo: Name (License)" from the rights record, for posts whose caption has no credit line.
function creditFromRights(dirs) {
  for (const d of dirs) {
    const rr = readJson(path.join(d, 'rights-record.json'));
    if (!rr) continue;
    const flat = JSON.stringify(rr);
    const req = flat.match(/"(?:required_credit|attribution|credit_line|credit)":\s*"([^"]{3,120})"/);
    if (req) return req[1].replace(/^(Photo|Image|Artwork)?:?\s*/i, (m) => (m.trim() ? m : 'Photo: '));
    const who = flat.match(/"(?:creator|author|photographer|owner)":\s*"([^"]{2,80})"/);
    const lic = flat.match(/"(?:license|license_name)":\s*"([^"]{2,60})"/);
    if (who) return `Photo: ${who[1]}${lic ? ` (${lic[1]})` : ''}`;
  }
  return '';
}

function toJpg(src, out, max) {
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '80', '-Z', String(max), src, '--out', out], { stdio: 'ignore' });
}

function pickMedia(r, dirs, slug) {
  const graphicSrc = r.image_file && fs.existsSync(r.image_file) ? r.image_file
    : r.original_png_path && fs.existsSync(r.original_png_path) ? r.original_png_path
    : findInPackages(dirs, ['post.jpg', 'post.png', 'cover.jpg', 'cover.png']);
  const photoSrc = findSourcePhoto(dirs);
  const media = { image: '', graphic: '', show_image: !reuseRestricted(dirs, r), credit: creditFromRights(dirs) };
  try {
    if (graphicSrc) { if (!DRY) toJpg(graphicSrc, path.join(MEDIA, `${slug}.jpg`), 1350); media.graphic = `/media/posts/${slug}.jpg`; }
    if (photoSrc) { if (!DRY) toJpg(photoSrc, path.join(MEDIA, `${slug}-photo.jpg`), 1600); media.image = `/media/posts/${slug}-photo.jpg`; }
  } catch { /* keep going without media */ }
  if (!media.image) media.image = media.graphic;
  return media;
}

function parseCaption(caption = '') {
  const lines = caption.replace(/\r/g, '').split('\n');
  const tags = [];
  const sources = [];
  const credits = [];
  const body = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (/^(#\w+\s*)+$/.test(line)) { tags.push(...line.match(/#\w+/g).map((t) => t.slice(1))); continue; }
    const s = line.match(/^Sources?:\s*(.+)$/i);
    if (s) { sources.push(...s[1].split(/;|,(?![^()]*\))/).map((x) => x.trim()).filter(Boolean)); continue; }
    if (/^(Photo|Photos|Image|Images|Logo|Artwork|Poster|Map|Video|Music|Footage)\b[^:]*:/i.test(line) || /^Photo by\b/i.test(line)) { credits.push(line); continue; }
    if (/^(Status|Verified|Last verified):/i.test(line)) continue;
    body.push(raw);
  }
  const text = body.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return { text, tags, sourceNames: sources, credits };
}

function plainHandles(t) {
  return t
    // "Downtown Bentonville’s @downtownbentonville First Friday" -> drop the repeated handle
    .replace(/([A-Z][\w.&’' -]{2,40}?)(’s|'s)?\s+@([A-Za-z0-9_.]*[A-Za-z0-9_])/g, (m, name, poss, h) =>
      (HANDLES[h.toLowerCase()] || '').toLowerCase() === name.trim().toLowerCase() ? `${name}${poss || ''}` : m)
    .replace(/(^|[\s(’'])@([A-Za-z0-9_.]*[A-Za-z0-9_])/g, (_, pre, h) => `${pre}${HANDLES[h.toLowerCase()] || h}`);
}

function cleanTitle(s) {
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?/gu, '').replace(/^(NOW OPEN|NEW|JUST IN|UPDATE):\s*/i, '').replace(/\s+/g, ' ').trim();
}

// Sentence end: punctuation, then space and a capital, not after a one-letter initial (S. Washington).
function firstSentence(t) {
  const para = (t.split(/\n\s*\n/).find((l) => l.trim()) || '').replace(/\s+/g, ' ').trim();
  const re = /[.!?](?=\s+[A-Z“"])/g;
  let m;
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
  const cut = s.slice(0, max);
  const at = Math.max(...[':', ',', ' with ', ' for ', ' in ', ' on ', ' at '].map((x) => cut.lastIndexOf(x)));
  return (at > 30 ? cut.slice(0, at) : cut.slice(0, cut.lastIndexOf(' '))).replace(/[,;:]+$/, '').replace(/\s+(in|on|at|to|for|with|and|the|a)$/i, '').trim();
}

function summarize(t, max = 220) {
  const para = plainHandles((t.split(/\n\s*\n/).find((l) => l.trim()) || '').replace(/\s+/g, ' ').trim());
  if (para.length <= max) return para;
  const cut = para.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…';
}

function linkHandles(t) {
  return t.replace(/(^|[\s(])@([A-Za-z0-9_.]*[A-Za-z0-9_])/g, (_, pre, h) => `${pre}[@${h}](https://www.instagram.com/${h}/)`);
}

const CATEGORY_MAP = [
  [/\b(festival|fest|fair|market|parade|celebration|gala|fan zone|crawl|funday|meetup|first friday)\b/i, 'Events'],
  [/\b(music|concert|band|vinyl|record fair|dj|tour|film|films|screening|art|arts|museum|exhibit(ion)?|theat(er|re)|comedy|gallery|pottery)\b/i, 'Arts & Music'],
  [/\b(store|shop|retail|business|startup|hotel)\b/i, 'Business'],
  [/\b(restaurant|food|caf[eé]|coffee|bar|brew(ing|ery)?|eats?|pizza|tacos?|bakery|dining|kitchen|ribhouse|chick-fil-a|mediterranean|dinner|lunch|brunch)\b/i, 'Food & Drink'],
  [/\b(trails?|parks?|bike|greenway|outdoors?|lake|river|nature|garden)\b/i, 'Outdoors'],
  [/\b(construction|development|expansion|groundbreaking|repaving|sidewalk|road work|housing|proposed)\b/i, 'Development'],
];

// Title first, then the full caption, so a passing mention ("food trucks") doesn't win.
function categorize(title, text) {
  for (const hay of [title, text]) for (const [re, name] of CATEGORY_MAP) if (re.test(hay)) return name;
  return 'News';
}

function statusVerb(title, text) {
  const t = title.toLowerCase();
  if (!/\b(open|opens|opened|opening|reopen|coming back|clos|construction|proposed|build|expan|moves?|moving|renamed|new location|work begins|repaving)/.test(t)) {
    return /\b(now open|is open|has opened|opened)\b/i.test(text) ? 'opening' : '';
  }
  if (/\b(reopen(s|ing)?|coming back)\b/.test(t)) return 'opening';
  if (/\b(closing|closes|final day|last day|shutting down)\b/.test(t)) return 'closing';
  if (/\b(construction|groundbreaking|expansion|expanding|proposed|will build|under way|underway|breaks ground|work begins|repaving)\b/.test(t)) return 'building';
  if (/\b(now open|is open|opened|opens|opening|grand opening|debuts?|new location|launch(es|ed)?)\b/.test(t)) return 'opening';
  if (/\b(moves?|moving|renamed|rebrand|new owner|changes?|returns?)\b/.test(t)) return 'changing';
  return '';
}

const VENUE_CITY = [
  [/momentary|crystal bridges|r[øo]de house|downtown bentonville|walmart home office|8th street market/i, 'Bentonville'],
  [/walton arts center|botanical garden of the ozarks|dickson street|university of arkansas|razorback/i, 'Fayetteville'],
  [/jones center|arts center of the ozarks/i, 'Springdale'],
  [/pinnacle hills|amp\b|walmart amp/i, 'Rogers'],
];
function findCity(meta, text) {
  if (meta.city && CITIES.includes(meta.city)) return meta.city;
  // The city named first in the caption wins, so a passing mention of another town does not.
  const hits = CITIES.map((c) => ({ c, i: text.search(new RegExp(`\\b${c}\\b`, 'i')) })).filter((h) => h.i >= 0).sort((a, b) => a.i - b.i);
  if (hits.length) return hits[0].c;
  for (const [re, c] of VENUE_CITY) if (re.test(text)) return c;
  for (const c of [...CITIES, ...NEARBY]) if (new RegExp(`\\b${c}\\b`, 'i').test(text)) return c;
  return 'Northwest Arkansas';
}

function slugify(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70).replace(/-[^-]*$/, (m) => (m.length < 3 ? '' : m));
}

function toIsoDate(ts) {
  if (!ts) return new Date().toISOString();
  const fixed = String(ts).replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const d = new Date(fixed);
  return isNaN(d) ? new Date().toISOString() : d.toISOString();
}

// ---------- run ----------
// Visual credits only. Falls back to the rights record, then to "Image via <first source>" (Sam, 2026-11-01).
function visualCredits(lines, fallback, sources) {
  const keep = (lines || []).filter((l) => !/^(Music|Audio|Song|Sound)\b/i.test(l));
  if (keep.length) return keep;
  if (fallback) return [fallback];
  const src = (sources || []).find((x) => x && x.name);
  return src ? [`Image via ${src.name}`] : [];
}

function refreshMedia(name, r) {
  const f = path.join(ARTICLES, name);
  const parsed = matter(fs.readFileSync(f, 'utf8'));
  if (!parsed.data.synced_from || parsed.data.media_locked) return;
  // Only the primary post refreshes media; the Reel of the same story has no photo and would downgrade it.
  if (shortcode(parsed.data.instagram) !== shortcode(r.live_readback?.permalink || r.permalink)) return;
  const slug = name.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const m = pickMedia(r, packageDirsFor(r), slug);
  delete parsed.data.image_cleared;
  Object.assign(parsed.data, { image: m.image || undefined, graphic: m.graphic || undefined, show_image: m.show_image, credits: visualCredits(parsed.data.credits, m.credit, parsed.data.sources) });
  for (const k of Object.keys(parsed.data)) if (parsed.data[k] === undefined || parsed.data[k] === '') delete parsed.data[k];
  if (!DRY) fs.writeFileSync(f, matter.stringify(parsed.content, parsed.data));
}

const added = [];
const skipped = [];
const seenStories = new Map(existingStories);
const extraLinks = new Map();
const isReelItem = ({ receipt: r, permalink }) => /\/reel\//.test(permalink) || r.media_format === 'reel' || !!r.video_file;
const ordered = [...byCode].sort(([, a], [, b]) => isReelItem(a) - isReelItem(b));
for (const [code, { file, receipt: r, permalink }] of ordered) {
  if (existing.has(code)) {
    if (REFRESH_MEDIA) refreshMedia(existing.get(code), r);
    skipped.push(`${code} (already on site: ${existing.get(code)})`);
    continue;
  }

  const dirs = packageDirsFor(r);
  const meta = storyMeta(dirs);
  const caption = r.live_readback?.caption || '';
  const altText = r.live_readback?.alt_text || '';
  const { text, tags, sourceNames, credits } = parseCaption(caption);
  const title = trimTitle(plainHandles(meta.headline || firstSentence(text) || 'NWA Next update').replace(/\s+/g, ' ').trim());
  const storyKey = storyKeyOf(r.story_id);
  if (storyKey && seenStories.has(storyKey)) { skipped.push(`${code} (second format of ${seenStories.get(storyKey)})`); extraLinks.set(seenStories.get(storyKey), permalink); continue; }
  const date = toIsoDate(r.published_at || r.live_readback?.timestamp);
  const slug = slugify(title) || code.toLowerCase();
  const isReel = /\/reel\//.test(permalink) || r.media_format === 'reel' || !!r.video_file;

  const media = pickMedia(r, dirs, slug);

  const sources = meta.sources?.length ? meta.sources
    : sourceNames.map((n) => ({ name: n, url: '' }));

  const fm = {
    title,
    date,
    city: findCity(meta, `${title} ${text}`),
    category: categorize(title, text),
    status: statusVerb(title, text),
    summary: summarize(text),
    ...(meta.eventDate ? { event_date: String(meta.eventDate).slice(0, 10) } : {}),
    instagram: permalink,
    format: isReel ? 'reel' : 'post',
    image: media.image,
    graphic: media.graphic,
    image_alt: altText,
    show_image: media.show_image,
    credits: visualCredits(credits, media.credit, sources),
    sources,
    tags,
    featured: false,
    story_id: String(r.story_id || ''),
    synced_from: file,
  };
  for (const k of Object.keys(fm)) if (fm[k] === undefined || fm[k] === '') delete fm[k];

  const name = `${date.slice(0, 10)}-${slug}.md`;
  const md = matter.stringify(`${linkHandles(text)}\n`, fm);
  if (!DRY) fs.writeFileSync(path.join(ARTICLES, name), md);
  existing.set(code, name);
  if (storyKey) seenStories.set(storyKey, name);
  added.push(name);
}

// A story published as both a post and a Reel becomes one article with both links.
for (const [name, link] of extraLinks) {
  if (DRY) break;
  const f = path.join(ARTICLES, name);
  const parsed = matter(fs.readFileSync(f, 'utf8'));
  if (parsed.data.instagram_also) continue;
  parsed.data.instagram_also = link;
  fs.writeFileSync(f, matter.stringify(parsed.content, parsed.data));
}

const log = { ran_at: new Date().toISOString(), dry_run: DRY, receipts_seen: receipts.length, unique_posts: byCode.size, added, skipped_count: skipped.length };
if (!DRY) fs.writeFileSync(path.join(ROOT, 'content/sync-log.json'), JSON.stringify(log, null, 2) + '\n');
console.log(`NWA Next sync: ${added.length} new, ${skipped.length} already on site, ${byCode.size} published posts found.`);
for (const a of added) console.log(`  + ${a}`);
