// The NWA Next design kit as HTML strings: logo marks, creek stones, buttons, icons, images and the view model every block uses.
// Pages render these at build time (static HTML); public/site.js adds the behaviour. Ported from the Round 4 comp (_Round4/build-site.mjs).
import MARKS from '../brand/marks.json';
import media from '../media.json';
import { getArticle, getCities, shortCredit, type Article, type City } from '../content';
import { items, type Item } from '../data';
import { TODAY, addDays } from '../now';
import { googleCalendarUrl } from '../when';

type Mark = { vb: number[]; nwa: string; next: string; all?: string; stone?: string; letters?: string };
const M = MARKS as unknown as Record<string, Mark>;
export const INK = '#16140F', CLAY = '#C9482A', CLAY_HI = '#E0603E', PAPER = '#F2EDE3', MOSS = '#2F5D3A';

// ---------------------------------------------------------------- text
export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const short = (t: string, n = 64) => (t.length > n ? t.slice(0, t.lastIndexOf(' ', n)).replace(/[,;:]$/, '') + '…' : t);
// Oversized headers: each word rises in on its own (site.css .split). A closing period gets its own span so it never touches the letter.
export const pd = (w: string) => w.replace(/([.?!])$/, '<span class="pd">$1</span>');
export const wd = (parts: string[], acc = -1) => parts.map((p, i) => `<span class="wd${i === acc ? ' acc' : ''}" style="--i:${i}">${p}</span>`).join(' ');
export const split = (s: string) => wd(esc(s).split(' ').map(pd));

// ---------------------------------------------------------------- stones (same outline as site.js)
const f1 = (v: number) => Math.round(v * 10) / 10;
type Pt = [number, number];
export function smooth(pts: Pt[]) {
  const n = pts.length, p = (i: number) => pts[(i + n) % n];
  let d = `M${p(0).map(f1)}`;
  for (let i = 0; i < n; i++) {
    const [a, b, c, e] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    d += ` C${[b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6].map(f1)} ${[c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6].map(f1)} ${c.map(f1)}`;
  }
  return d + 'Z';
}
const per = (f: number[], u: number) => {
  const n = f.length, x = u * n, i = Math.floor(x), t = x - i, p = (k: number) => f[(((i + k) % n) + n) % n], a = p(-1), b = p(0), c = p(1), d = p(2);
  return b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
};
export const blob = (cx: number, cy: number, rx: number, ry: number, ex: number, f: number[], rot = 0): Pt[] =>
  Array.from({ length: 48 }, (_, i) => {
    const u = i / 48, th = u * 2 * Math.PI + rot, c = Math.cos(th), s = Math.sin(th);
    const r = (Math.abs(c) ** ex / rx ** ex + Math.abs(s) ** ex / ry ** ex) ** (-1 / ex) * per(f, u);
    return [cx + r * c, cy + r * s];
  });
export const F0 = [1.0, 0.97, 0.96, 1.0, 1.03, 1.02, 0.99, 0.97, 1.0, 1.04, 1.03, 1.0];
export const stoneD = smooth(blob(100, 45, 95.5, 43, 2.7, F0, -0.06));
export const label = (t: string, cls = '') => `<span class="stone ${cls}"><svg viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true"><path d="${stoneD}"/></svg><span>${esc(t)}</span></span>`;

// ---------------------------------------------------------------- marks
// roll: a second "next" waits under the first, so the header logo can roll it up on hover (site.css .logo)
export const mark = (k: string, a: string, b: string, cls = '', roll: boolean | string = false) =>
  `<svg class="${cls}" viewBox="${M[k].vb.join(' ')}" aria-hidden="true"><path class="w1" fill="${a}" d="${M[k].nwa}"/><path class="w2" fill="${b}" d="${M[k].next}"/>${roll ? `<path class="w3" fill="${roll === true ? b : roll}" d="${M[k].next}"/>` : ''}</svg>`;
// Footer wordmark as two stacked layers (one word each), so the landing animates whole elements.
export const bigMark = () => `<svg class="bigsvg b1" viewBox="${M.horizontal.vb.join(' ')}" aria-hidden="true"><path fill="${INK}" d="${M.horizontal.nwa}"/></svg><svg class="bigsvg b2" viewBox="${M.horizontal.vb.join(' ')}" aria-hidden="true"><path fill="${CLAY}" d="${M.horizontal.next}"/></svg>`;
export const badge = (cls = '') => `<svg class="badge ${cls}" viewBox="${M.badge.vb.join(' ')}" aria-hidden="true"><path class="bs" fill="${INK}" d="${M.badge.stone}"/><path class="bl" fill="${PAPER}" d="${M.badge.letters}"/></svg>`;

// ---------------------------------------------------------------- icons and buttons
export const I = {
  cal: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>',
  heart: '<svg class="ic heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  arrow: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  left: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  pause: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
  caret: '<svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 5.5h7.5l3.5 5.83 3.5-5.83H23l-7.8 13H8.8z"/></svg>',
  x: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  search: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
  mail: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 7 8.5-7"/></svg>',
  ig: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>',
  tar: '<svg class="tar" viewBox="0 0 24 24" aria-hidden="true"><path d="M1.5 9.4h11.3V4.2L22.6 12l-9.8 7.8v-5.2H1.5z"/></svg>',
};
// Every button carries its label twice (.lb) so the slide hover can roll it; site.js keeps both in sync.
export const lb = (t: string) => `<span class="lb" data-t="${esc(t)}"><span>${esc(t)}</span></span>`;
export const B = (t: string, { cls = '', href, attrs = '', icon = '', type = 'button' }: { cls?: string; href?: string; attrs?: string; icon?: string; type?: string } = {}) =>
  href ? `<a class="btn ${cls}" href="${esc(href)}" ${attrs}>${icon}${lb(t)}</a>` : `<button type="${type}" class="btn ${cls}" ${attrs}>${icon}${lb(t)}</button>`;
export const more = (href: string, t = 'Full story') => `<a class="more" href="${esc(href)}">${esc(t)}${I.arrow}</a>`;
export const ext = 'target="_blank" rel="noopener"';

// ---------------------------------------------------------------- images (WebP srcset from lib/media.json, made by scripts/images.mjs)
type Info = { w: number; h: number; widths: number[] };
const MEDIA = media as Record<string, Info>;
export function img(src: string | undefined, sizes: string, w = 800, eager = false, alt = '') {
  if (!src) return '';
  const info = MEDIA[src];
  if (!info) return `<img src="${esc(src)}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  const base = src.replace(/\.[^.]+$/, '');
  const pick = info.widths.filter((x) => x <= w).pop() || info.widths[0];
  return `<img src="${base}-${pick}.webp" srcset="${info.widths.map((x) => `${base}-${x}.webp ${x}w`).join(', ')}" sizes="${sizes}" width="${info.w}" height="${info.h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

// ---------------------------------------------------------------- the view model
export type V = {
  slug: string; href: string; title: string; name: string; city: string; topic: string; summary: string;
  kind: 'event' | 'opening' | 'news'; upcoming: boolean; featured: boolean; free: boolean;
  date: string; // YYYY-MM-DD: the event day, or the day it was posted
  posted: string; postedIso: string; day: string; dayLong: string; mon: string; dnum: number;
  startRaw: string; endRaw: string; icsS: string; icsE: string; time: string; startT: string; multi: boolean; endDate: string;
  venue: string; at: string; address: string; full: string; price: string; tickets: string; ages: string; hours: string;
  cat: string; image?: string; alt: string; credit: string; sources: { name: string; url?: string }[]; ics: string; gcal: string; maps: string;
  a: Article;
};
const TZ = 'America/Chicago';
const dayOf = (key: string) => new Date(`${key}T12:00:00Z`);
const fmt = (key: string, o: Intl.DateTimeFormatOptions) => dayOf(key).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
const clock = (hm?: string) => { if (!hm) return null; let h = +hm.slice(0, 2); const m = hm.slice(3, 5), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return { t: m === '00' ? `${h}` : `${h}:${m}`, ap }; };
const line = (body: string, emoji: string) => (body.split('\n').find((l) => l.trim().startsWith(emoji)) || '').trim().slice(emoji.length).trim();
// Titles sometimes end with the date ("... on Saturday, Oct. 3"); the date shows beside it anyway.
const cleanTitle = (t: string) => t.replace(/ (on|this) (Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day,? ((Jan|Feb|Mar|Apr|May|June?|July?|Aug|Sept?|Oct|Nov|Dec)[a-z]*\.? \d+)?$/i, '').replace(/ tomorrow,? [A-Z][a-z]+ \d+$/, '');

export function view(i: Item): V {
  const a = getArticle(i.slug)!;
  const f = i.facts;
  const kind = f.kind === 'event' ? 'event' : f.kind === 'opening' ? 'opening' : 'news';
  const date = f.start || i.date.slice(0, 10);
  const s = clock(f.startTime), e = clock(f.endTime);
  const time = !s ? 'All day' : !e ? `${s.t} ${s.ap}` : s.ap === e.ap ? `${s.t}–${e.t} ${e.ap}` : `${s.t} ${s.ap}–${e.t} ${e.ap}`;
  const raw = (k: string, hm?: string) => k.replace(/-/g, '') + (hm ? `T${hm.replace(':', '')}00` : '');
  const startRaw = f.start ? raw(f.start, f.startTime) : '';
  const endRaw = f.start ? (f.end ? raw(f.end) : f.endTime ? raw(f.start, f.endTime) : '') : '';
  const timed = !!f.startTime && !f.end, endT = f.endTime || (f.startTime ? `${String(Math.min(23, +f.startTime.slice(0, 2) + 2)).padStart(2, '0')}:${f.startTime.slice(3)}` : '');
  const icsS = f.start ? (timed ? raw(f.start, f.startTime) : raw(f.start)) : '', icsE = f.start ? (timed ? raw(f.start, endT) : raw(addDays(f.end || f.start, 1))) : '';
  const venue = f.place && f.place.name !== i.city ? f.place.name : '';
  const where = [venue, f.place?.city || i.city].filter(Boolean).join(', ');
  const full = f.address ? [venue, f.address, `${f.place?.city || i.city}, AR`].filter(Boolean).join(', ') : where ? `${where}, AR` : `${i.city}, AR`;
  const tix = line(a.text, '🎟');
  const url = (tix.match(/((?:https?:\/\/)?[\w.-]+\.(?:com|org|net|edu|us|co|events|art)\S*)/) || [])[1]?.replace(/[.,]$/, '');
  const price = f.price === 'Free' || a.free ? 'Free' : tix && /\$/.test(tix) && kind === 'event' ? tix.replace(/\.$/, '') : f.price || '';
  // Some captions name the source in the text ("Source and media: Dodo Coffee Company."). Use it when the CMS fields are empty.
  const said = (a.text.match(/^Source and (?:media|image|photo)s?:\s*(.+?)\.?\s*$/im) || [])[1];
  const sources = a.sources.filter((x) => x.name).length ? a.sources.filter((x) => x.name) : said ? [{ name: said }] : [];
  const cat = [a.free && 'free', i.category === 'Arts & Music' && 'music', i.category === 'Outdoors' && 'outside'].filter(Boolean).join(' ');
  return {
    slug: i.slug, href: i.href, title: a.title, name: short(cleanTitle(a.title), 34), city: i.city, topic: i.category, summary: a.summary,
    kind, upcoming: f.upcoming, featured: a.featured, free: a.free, date,
    posted: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: TZ }), postedIso: a.date,
    day: fmt(date, { weekday: 'short' }), dayLong: fmt(date, { weekday: 'long' }), mon: fmt(date, { month: 'short' }), dnum: +fmt(date, { day: 'numeric' }),
    startRaw, endRaw, icsS, icsE, time, startT: s ? `${s.t} ${s.ap}` : 'All day', multi: !!f.end, endDate: f.end || '',
    venue, at: where || i.city, address: f.address || '', full, price, tickets: url ? (url.startsWith('http') ? url : `https://${url}`) : '',
    ages: (a.text.match(/\b(?:Ages \d+\+|All ages|21\+|18\+)/i) || [])[0] || '', hours: line(a.text, '🕖'),
    cat, image: a.showImage ? a.image : undefined, alt: a.imageAlt || '', credit: a.showImage ? shortCredit(a.credits) || said || '' : '', sources,
    ics: `/news/${i.slug}/event.ics`, gcal: googleCalendarUrl(a.title, f, `${a.summary}\n\nhttps://nwanext.com${i.href}`, full),
    maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(full)}`, a,
  };
}

// ---------------------------------------------------------------- coverage: Benton and Washington counties (Sam, 2026-11-21)
// cities.json keeps every town (the sync reads it); the site shows these two counties.
export const COUNTIES = ['Benton County', 'Washington County'];
export const inArea = (c: City) => /Benton|Washington/.test(c.county);
export const CITIES = () => getCities().filter(inArea);
export const countyOf = (c: City) => (c.county.includes('Washington') ? 'Washington County' : c.county); // Springdale spans both; it sits with Washington
export const cityUrl = (name: string) => { const c = CITIES().find((x) => x.name === name); return c ? `/cities/${c.slug}/` : '/cities/'; };

// Every story as a view, plus the lists the pages share.
let cache: V[] | null = null;
export const all = () => (cache ||= items().map(view));
const byStart = (a: V, b: V) => (a.startRaw < b.startRaw ? -1 : 1);
export const upcoming = () => all().filter((v) => v.kind === 'event' && v.upcoming).sort(byStart);
export const pastEvents = () => all().filter((v) => v.kind === 'event' && !v.upcoming).sort((a, b) => -byStart(a, b));
export const openings = () => all().filter((v) => v.kind === 'opening');
export const news = () => all().filter((v) => v.kind === 'news');
export const today = TODAY;
// The day an event shows under: its start, or today if it started already and still runs.
export const showDay = (v: V) => (v.date < TODAY && v.endDate && v.endDate >= TODAY ? TODAY : v.date);

// ---------------------------------------------------------------- shared small parts
let calN = 0;
export const calMenu = (v: V, cls = '') => { const id = `cal${++calN}`; return `<button type="button" class="btn ${cls} calb" popovertarget="${id}" aria-haspopup="menu" aria-expanded="false">${I.cal}${lb('Add to calendar')}</button><div class="calm" id="${id}" popover role="menu">
<a role="menuitem" href="${esc(v.gcal)}" ${ext}>Google Calendar</a><a role="menuitem" href="${v.ics}">Apple Calendar</a><a role="menuitem" href="${v.ics}">Outlook</a></div>`; };
export const save = (v: V, cls = 'line') => B('Save', { cls: `${cls} save`, attrs: `data-id="${v.slug}" aria-pressed="false"`, icon: I.heart });
export const when = (v: V) => (v.multi ? `${v.mon} ${v.dnum}–${fmt(v.endDate, { month: v.endDate.slice(5, 7) === v.date.slice(5, 7) ? undefined : 'short', day: 'numeric' })}` : `${v.day}, ${v.mon} ${v.dnum}, ${v.time}`);
export const dateLong = (v: V) => `${v.dayLong}, ${v.mon} ${v.dnum}`;
export const factsDl = (v: V) => `<dl class="facts">
<div><dt>When</dt><dd>${v.multi ? when(v) : `${dateLong(v)}<br>${v.time}`}</dd></div>
<div><dt>Where</dt><dd>${esc(v.venue || v.city)}${v.address ? `<br>${esc(v.address)}` : ''}<br><a href="${esc(v.maps)}" ${ext}>Directions</a></dd></div>
${v.price ? `<div><dt>Cost</dt><dd>${v.price === 'Free' ? '<span class="free">Free</span>' : esc(v.price)}</dd></div>` : v.tickets ? `<div><dt>Cost</dt><dd><a href="${esc(v.tickets)}" ${ext}>See tickets</a></dd></div>` : ''}
${v.ages ? `<div><dt>Ages</dt><dd>${esc(v.ages)}</dd></div>` : ''}</dl>`;

// Sentence pickers (card popover on desktop, bottom sheet on phones). Counts are filled in by site.js.
export type Opt = { v: string; t: string; l?: string };
export const pick = (key: string, list: Opt[], name: string) => `<button type="button" class="pick" id="p-${key}" data-key="${key}" data-value="${esc(list[0].v)}" popovertarget="pm-${key}" aria-haspopup="listbox" aria-expanded="false"><span class="vh">${name}: </span><span class="v">${esc(list[0].t)}</span>${I.caret}</button>`;
export const pickMenu = (key: string, list: Opt[], title: string) => `<div class="pm" id="pm-${key}" popover role="listbox" aria-label="${title}"><p class="mh">${title}</p>${list.map((o, i) => `<button type="button" role="option" aria-selected="${i === 0}" data-value="${esc(o.v)}" data-t="${esc(o.t)}"><svg class="dot" viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true"><path d="${stoneD}"/></svg><span class="o">${esc(o.l || o.t[0].toUpperCase() + o.t.slice(1))}</span><span class="n"></span></button>`).join('')}</div>`;
export const townOpts = (list: V[]): Opt[] => [{ v: 'all', t: 'all of NWA' }, ...CITIES().filter((c) => list.some((o) => o.city === c.name)).map((c) => ({ v: c.name, t: c.name }))];
export const WHAT: Opt[] = [{ v: 'all', t: 'everything' }, { v: 'free', t: 'free stuff' }, { v: 'music', t: 'music and art' }, { v: 'outside', t: 'things outside' }];
// A JSON island for site.js (never executed as script).
export const data = (id: string, v: unknown) => `<script type="application/json" id="${id}">${JSON.stringify(v).replace(/</g, '\\u003c')}</script>`;
