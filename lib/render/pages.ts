// Every page body as HTML. app/**/page.tsx files call these and wrap them in the shell.
import { getGuides, getPhotos, getResources, getSite, slugify, type City } from '../content';
import { PLACES, TOPICS, placeBySlug, type Topic } from '../taxonomy';
import { addDays } from '../now';
import { B, CITIES, COUNTIES, I, all, badge, calMenu, cityUrl, countyOf, data, esc, ext, factsDl, img, label, lb, mark, INK, CLAY, more, news, openings, pastEvents, pick, pickMenu, save, short, showDay, split, today, townOpts, upcoming, wd, type V } from './kit';
import { subButtons, agendaRows, around, countsFor, hero, heroSlides, newsItem, onBlock, pghead, secHead, spotCard, townsBlock, weekendsBlock } from './blocks';
import { EMAIL, SOURCING, TAG, newsletterForm, shell, tipForm, tipStones } from './shell';
import { countsOf, townData, townMap } from './towns';

const latest = () => all().filter((v) => v.kind !== 'event');

// ---------------------------------------------------------------- home
export function home() {
  const slides = heroSlides(all());
  const spots = openings().slice(0, 3);
  const nw = news().slice(0, 6);
  return shell({ cur: '/', over: slides.length > 0, body: `${slides.length ? hero(slides) : pghead('What’s next in Northwest Arkansas.', esc(TAG.join(' ')))}${onBlock()}${weekendsBlock()}
${spots.length ? `<section class="sec wrap rv">${secHead('New spots', ['/openings/', 'All new spots'])}<div class="spots">${spots.map((v, i) => spotCard(v, i ? '30vw' : '40vw')).join('')}</div></section>` : ''}
${nw.length ? `<section class="sec wrap rv">${secHead('Around NWA', ['/news/', 'All news'])}${around(nw)}</section>` : ''}
${townsBlock(all())}` });
}

// ---------------------------------------------------------------- what's on
export function events() {
  const past = pastEvents().slice(0, 6);
  return shell({ cur: '/events/', body: `${onBlock('h1')}${weekendsBlock()}
${!upcoming().length && past.length ? `<section class="sec wrap rv">${secHead('Recently', ['/calendar/', 'See the calendar'])}<div class="spots">${past.map((v) => spotCard(v, '30vw', '', '')).join('')}</div></section>` : ''}` });
}

// ---------------------------------------------------------------- new spots and news (filter by town)
export function openingsPage() {
  const list = openings();
  return shell({ cur: '/openings/', body: `${pghead(wd(['New', 'spots', 'in', pick('town', townOpts(list), 'Town')]), 'Restaurants, shops and places that just opened across Benton and Washington counties.', true, pickMenu('town', townOpts(list), 'Pick a town'))}
<section class="wrap spotgrid filt rv">${list.map((v, i) => spotCard(v, i === 0 ? '(max-width:700px) 100vw, 60vw' : '(max-width:700px) 50vw, 30vw', i === 0 ? 'lead' : '')).join('')}<p class="empty" ${list.length ? 'hidden' : ''}>No new spots posted there yet.</p></section>` });
}
export function newsPage() {
  const list = news();
  return shell({ cur: '/news/', body: `${pghead(wd(['News', 'from', pick('town', townOpts(list), 'Town')]), 'What’s being built, proposed and changed across Benton and Washington counties, with the source on every story.', true, pickMenu('town', townOpts(list), 'Pick a town'))}
<section class="wrap newsgrid filt rv">${list.map((v, i) => newsItem(v, i === 0)).join('')}<p class="empty" ${list.length ? 'hidden' : ''}>No news posted there yet.</p></section>
${openings().length ? `<section class="sec wrap rv">${secHead('Just opened', ['/openings/', 'All new spots'])}${around(openings().slice(0, 6))}</section>` : ''}` });
}

// ---------------------------------------------------------------- towns
export function towns() {
  const counts = countsOf(upcoming(), openings(), news());
  const T = townData(counts), total = (k: 'ev' | 'sp' | 'nw') => T.reduce((n, t) => n + t[k], 0);
  return shell({ cur: '/cities/', body: `<section class="wrap twh">
<div class="twl"><h1 class="split">${split('Pick a town')}</h1>
<div class="tcard" aria-live="polite"><div class="tci">
<p class="tck">Benton and Washington counties</p><h2>${T.length} towns, one corner of Arkansas.</h2><p class="tcp">Five cities run together along I-49, with smaller towns all around them. Pick one on the map to see what’s going on there.</p>
<ul class="tcn"><li><b>${total('ev')}</b> coming up</li><li><b>${total('sp')}</b> new spots</li><li><b>${total('nw')}</b> news</li></ul></div></div></div>
<div class="tmapbox">${townMap(counts)}</div>
</section>
<section class="sec wrap rv tdir">${secHead('Every town')}<div class="cpans">${COUNTIES.map((co, i) => { const cs = CITIES().filter((c) => countyOf(c) === co); return `<div class="cpan ${i ? 'wa' : 'be'}"><h3>${co}<span>${cs.length} towns</span></h3><p class="townlist">${cs.map((c) => { const n = countsFor(all(), c.name); return `<a href="${cityUrl(c.name)}" class="${n ? 'f' : ''}">${esc(c.name)}${n ? `<sup>${n}</sup>` : ''}</a>`; }).join(' ')}</p></div>`; }).join('')}</div></section>
${data('towns', T)}` });
}

export function town(c: City) {
  const mine = all().filter((v) => v.city === c.name);
  const ev = upcoming().filter((v) => v.city === c.name), sp = openings().filter((v) => v.city === c.name), nw = news().filter((v) => v.city === c.name);
  const recent = pastEvents().filter((v) => v.city === c.name).slice(0, 3);
  const ph = getPhotos().find((p) => p.city === c.name);
  const base = ph?.src.replace(/\.[^.]+$/, '');
  const phImg = ph ? `<img src="${base}-1600.webp" srcset="${[480, 800, 1200, 1600].map((s) => `${base}-${s}.webp ${s}w`).join(', ')}" sizes="100vw" alt="${esc(ph.caption)}" fetchpriority="high">` : '';
  return shell({ cur: '/cities/', body: `<section class="thero ${ph ? 'photo' : 'plain'}">${phImg}<div class="copy wrap"><h1 class="split">${split(c.name)}</h1><p>${esc(c.intro)}</p><p class="cty">${esc(c.county)}</p></div></section>
${mine.length ? `<section class="sec wrap rv">${secHead(`What’s on in ${c.name}`, ['/events/', 'All events'])}${ev.length ? `<div class="agenda solo">${agendaRows(ev)}</div>` : `<p class="nothing">Nothing coming up in ${esc(c.name)} yet. We add events as soon as we confirm them. ${B('Tell us about one', { cls: 'line sm', attrs: 'data-open="tip" data-kind="event"' })}</p>`}</section>` : ''}
${sp.length ? `<section class="sec wrap rv tight">${secHead(`New in ${c.name}`)}<div class="spots">${sp.slice(0, 3).map((v) => spotCard(v)).join('')}</div></section>` : ''}
${nw.length ? `<section class="sec wrap rv tight">${secHead(`Changing in ${c.name}`)}<div class="around">${nw.map((v) => `<a href="${v.href}"><h3>${esc(v.title)}</h3><span>${v.posted}</span></a>`).join('')}</div></section>` : ''}
${recent.length ? `<section class="sec wrap rv tight">${secHead(`Recently in ${c.name}`)}<div class="spots">${recent.map((v) => spotCard(v, '30vw', '', '')).join('')}</div></section>` : ''}
${!mine.length ? `<section class="sec wrap rv tight"><p class="nothing">No stories from ${esc(c.name)} yet. Know something we should cover? ${B('Send a tip', { cls: 'clay sm', attrs: 'data-open="tip"' })}</p></section>` : ''}
${townsBlock(all(), 'More towns', 'h3')}${ph ? `<p class="wrap pcred">Top photo: ${esc(ph.caption)}. ${esc(ph.author)}, <a href="${esc(ph.license_url || ph.source)}" ${ext}>${esc(ph.license)}</a>. <a href="${esc(ph.source)}" ${ext}>Original</a></p>` : ''}` });
}
// Towns outside Benton and Washington counties: the old address points people to the towns page.
export const outOfArea = (c: City) => shell({ cur: '/cities/', body: `${pghead(c.name, `NWA Next covers Benton and Washington counties now, so ${esc(c.name)} doesn’t have its own page anymore.`)}<section class="wrap rv"><p class="nothing">${B('See the towns we cover', { cls: 'clay', href: '/cities/', icon: I.arrow })}</p></section>`, tipsBand: false });

// ---------------------------------------------------------------- story
const URLRE = /^(?:Details:\s*|Tickets:\s*|More info:\s*)?((?:https?:\/\/)?[\w.-]+\.(?:com|org|net|edu|us|co|pizza|gov|events|art|coffee)\/?\S*)$/i;
const words = (s: string) => new Set(s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/@/g, '').toLowerCase().match(/[a-z0-9’']+/g) || []);
const repeats = (p: string, ref: string) => { const a = words(p), b = words(ref); if (!a.size) return false; let n = 0; a.forEach((w) => b.has(w) && n++); return n / a.size > 0.7; };
const md = (s: string) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, `<a href="$2" ${ext}>$1</a>`)
  .replace(/(^|[\s(])((?:https?:\/\/)?(?:www\.)?([\w-]+\.(?:com|org|net|edu|us|co|pizza|gov|events|art|coffee))(\/[^\s<)]*)?)(?=[\s.,;)]|$)/g, (m, pre, url, host) => `${pre}<a href="${url.startsWith('http') ? url : 'https://' + url}" ${ext}>${host}</a>`);

export function story(v: V) {
  const a = v.a, paras = a.text.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const links: string[] = [];
  const body = paras.filter((p) => {
    if (/^[📍🎟🕖🗓]/u.test(p)) return false; // facts block, shown in the side panel
    const u = p.match(URLRE); if (u) { links.push(u[1].startsWith('http') ? u[1] : 'https://' + u[1]); return false; }
    if (/^(Send this|Tag |Save this|Follow |#|Sources?:|Photos?:|Images?:)/.test(p)) return false; // social-only lines, and credits shown elsewhere
    if (repeats(p, a.title) && words(p).size <= words(a.title).size + 4) return false; // a short line that restates the headline
    return true;
  });
  const dekCovered = !v.summary || body.some((p) => repeats(v.summary, p));
  const src = (a.sources || []).filter((s) => s.name);
  const kind = v.kind === 'event' ? 'Event' : v.kind === 'opening' ? 'New spot' : 'News';
  const pool = v.kind === 'event' ? (upcoming().length ? upcoming() : pastEvents()) : v.kind === 'opening' ? openings() : news();
  const sameTown = pool.filter((x) => x.slug !== v.slug && x.city === v.city), rest = pool.filter((x) => x.slug !== v.slug && x.city !== v.city);
  const rel = [...sameTown, ...rest].slice(0, 3);
  const cur = v.kind === 'event' ? '/events/' : v.kind === 'opening' ? '/openings/' : '/news/';
  const side = v.kind === 'event'
    ? `${!v.upcoming ? `<p class="past">This was on ${v.dayLong}, ${v.mon} ${v.dnum}. <a href="/events/">See what’s coming up</a></p>` : ''}${factsDl(v)}<div class="acts">${v.upcoming ? calMenu(v, 'clay') + save(v) : ''}${v.tickets ? B('Tickets', { cls: 'line', href: v.tickets, attrs: ext }) : ''}</div>`
    : `<dl class="facts">${v.address || v.venue || v.city ? `<div><dt>Where</dt><dd>${esc(v.address || v.at)}<br><a href="${esc(v.maps)}" ${ext}>Directions</a></dd></div>` : ''}${v.hours ? `<div><dt>Hours</dt><dd>${esc(v.hours)}</dd></div>` : ''}<div><dt>Posted</dt><dd>${v.posted}</dd></div></dl>${links[0] ? `<div class="acts">${B('Visit their site', { cls: 'ink', href: links[0], attrs: ext, icon: I.arrow })}</div>` : ''}`;
  const srcUrl = src.find((x) => x.url)?.url;
  const fig = v.image ? `<figure class="stph">${label(kind)}${img(v.image, '(max-width:1000px) 100vw, 28rem', 1600, true, v.alt)}${v.credit || a.instagram ? `<figcaption>${v.credit ? `<span>Photo: ${srcUrl ? `<a href="${esc(srcUrl)}" ${ext}>${esc(v.credit)}</a>` : esc(v.credit)}</span>` : ''}${a.instagram ? `<a class="orig" href="${esc(a.instagram)}" ${ext}>Original post${I.arrow}</a>` : ''}</figcaption>` : ''}</figure>` : `<div class="stph none">${label(kind)}</div>`;
  return shell({ cur, body: `<article class="story wrap">
<div class="stmain"><header class="sthead rv"><h1>${esc(a.title)}</h1>${dekCovered ? '' : `<p class="dek">${esc(v.summary)}</p>`}<p class="meta"><a href="${cityUrl(v.city)}">${esc(v.city)}</a> · Posted ${v.posted}</p></header>
<div class="prose rv">${body.map((p) => `<p>${md(p)}</p>`).join('')}
${links.length && v.kind === 'event' ? `<p><a href="${esc(links[0])}" ${ext}>Event details from the organizer</a></p>` : ''}
${src.length ? `<div class="srcs"><h2>Sources</h2><ul>${src.map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" ${ext}>${esc(s.name)}</a>` : esc(s.name)}</li>`).join('')}</ul></div>` : ''}
<p class="fix">See something wrong? ${B('Tell us', { cls: 'line sm', attrs: 'data-open="tip"' })}</p></div>
</div>
<div class="strail rv">${fig}<aside class="stside">${side}</aside></div></article>
${rel.length ? `<section class="sec wrap rv">${secHead(v.kind === 'event' ? (upcoming().length ? 'More worth going to' : 'More events') : v.kind === 'opening' ? 'More new spots' : 'More news')}<div class="spots rel">${rel.map((r) => `<article class="spot" data-city="${esc(r.city)}"><div class="ph">${img(r.image, '30vw', 800, false, r.alt)}${r.image ? '' : `<span class="noph">${esc(r.city)}</span>`}</div><h3><a href="${r.href}">${esc(short(r.title, 80))}</a></h3><p>${r.kind === 'event' ? `${r.day}, ${r.mon} ${r.dnum} · ` : ''}${esc(r.city)}</p></article>`).join('')}</div></section>` : ''}` });
}

// ---------------------------------------------------------------- about, credits, privacy
export function about() {
  const s = getSite(), A = all();
  const stats: [number, string][] = [[A.length, 'stories'], [A.filter((v) => v.kind === 'event').length, 'events covered'], [openings().length, 'new spots'], [CITIES().length, 'towns']];
  return shell({ body: `${pghead('What’s next in Northwest Arkansas.', `${esc(TAG[0])} ${esc(TAG[1])}`)}
<section class="wrap rv stats"><ul>${stats.map(([n, l]) => `<li><b>${n}</b><span>${l}</span></li>`).join('')}</ul></section>
<section class="wrap rv about"><div><h2>Where we cover</h2><p>Benton and Washington counties: Bentonville, Rogers, Springdale, Fayetteville and Farmington, plus the ${CITIES().length - 5} towns around them.</p></div>
<div><h2>What we cover</h2><p>New restaurants and shops, local events worth leaving the house for, and the building and changes that affect how people live and get around.</p></div>
<div><h2>Where it comes from</h2><ul><li>${esc(SOURCING)}</li><li>Every story lists its sources, with links when there are some.</li><li>Photos are credited to the people and organizations they came from, with a link to the original post when there is one.</li><li>If something’s wrong or out of date, tell us and we’ll fix it.</li></ul></div>
<div><h2>Get in touch</h2><p>Tips, corrections or a photo you’d like credited differently: send a message or email <a href="mailto:${EMAIL}">${EMAIL}</a>. You can also find us on Instagram at <a href="${esc(s.instagram)}">@${esc(s.instagramHandle)}</a>.</p>${B('Send a tip', { cls: 'clay', attrs: 'data-open="tip"', icon: I.arrow })}</div></section>` });
}

export function credits() {
  const A = all().filter((v) => v.credit || v.a.sources.length);
  return shell({ body: `${pghead('Credits', `${esc(SOURCING)} Photos belong to the people and organizations named here. If one of them is yours and you’d like it credited differently or taken down, email <a href="mailto:${EMAIL}">${EMAIL}</a>.`)}
<section class="wrap rv credl"><h2>Stories</h2><ul>${A.map((v) => { const src = v.a.sources.filter((s) => s.name); return `<li><a href="${v.href}">${esc(v.name)}</a><span>${v.credit ? `Photo: ${esc(v.credit)}` : ''}${v.credit && src.length ? '<br>' : ''}${src.length ? `Sources: ${src.map((s) => (s.url ? `<a href="${esc(s.url)}" ${ext}>${esc(s.name)}</a>` : esc(s.name))).join(', ')}` : ''}</span></li>`; }).join('')}</ul>
<h2>Town photos</h2><p class="small">From Wikimedia Commons, under the licenses named.</p><ul>${getPhotos().map((p) => `<li><a href="${esc(p.source)}" ${ext}>${esc(p.caption)}</a><span>${esc(p.author)}, <a href="${esc(p.license_url || p.source)}" ${ext}>${esc(p.license)}</a></span></li>`).join('')}</ul>
<h2>Map</h2><ul><li><span>State lines</span><span>U.S. Census Bureau, via the us-atlas project (public domain). Beaver Lake is drawn by hand.</span></li></ul></section>`, tipsBand: false });
}

export function privacy() {
  const ga = /^G-/.test(getSite().analytics?.googleId || '');
  const h = (id: string, t: string) => `<h2 id="${id}">${t}</h2>`;
  return shell({ body: `${pghead('Privacy', 'What this site keeps, why, and how to get it removed. Short version: very little, and we never sell it.')}
<section class="wrap rv privacy"><nav class="ptoc" aria-label="On this page"><p>On this page</p><a href="#plans">Saved plans</a><a href="#forms">Newsletter and tips</a>${ga ? '<a href="#analytics">Analytics</a>' : ''}<a href="#hosting">Hosting</a><a href="#sources">Where our stories come from</a><a href="#choices">Your choices</a><a href="#contact">Contact</a></nav>
<div class="prose solo">
<p class="upd">Updated November 21, 2026</p>
${h('plans', 'Saved plans')}<p>When you tap Save on an event, it’s stored in your browser on this device. It never reaches us, there’s no account, and clearing your browser’s site data removes it. Calendar files you download are made on your device too.</p>
${h('forms', 'The newsletter and tips')}<p>If you sign up for the newsletter, we keep your email address and the page you signed up on, so we can send you the newsletter. If you send a tip, we keep what you write and, if you add it, your email address, so we can follow up.</p><p>Both forms send what you type to a Google Sheet that only NWA Next can open, through a small Google Apps Script. If you email us at <a href="mailto:${EMAIL}">${EMAIL}</a>, your message stays in that inbox. We use these only for the newsletter and for following up on tips. We don’t sell, rent or share them with advertisers.</p>
${ga ? `${h('analytics', 'Analytics')}<p>We use Google Analytics to count visits and see which stories people read. It records things like the pages you open, the site that sent you, your device and browser, and a rough location worked out from your IP address. Google Analytics sets cookies to do this. We look at totals, not at individual people, and we don’t use it for ads.</p><p>You can block it with a content blocker or <a href="https://tools.google.com/dlpage/gaoptout" ${ext}>Google’s opt-out add-on</a>. Google explains how it handles this data in its <a href="https://policies.google.com/technologies/partner-sites" ${ext}>partner sites policy</a>.</p>` : ''}
${h('hosting', 'Hosting')}<p>The site is hosted on GitHub Pages. Like any web host, GitHub may log the IP address of each visit for security; see <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" ${ext}>GitHub’s privacy statement</a>. Fonts are served from this site, not from a third party. There are no ads and no social media trackers on the site.</p>
${h('sources', 'Where our stories come from')}<p>${esc(SOURCING)} Each story lists its sources, and each photo names who it came from, with a link to the original post when there is one. If a photo or detail about you or your business should be changed or taken down, email us and we’ll take care of it.</p>
${h('choices', 'Your choices')}<p>To stop the newsletter, or to have your email address or a tip you sent deleted, email <a href="mailto:${EMAIL}">${EMAIL}</a> from the address you used and we’ll remove it. The site isn’t meant for children under 13, and we don’t knowingly collect anything from them.</p>
${h('contact', 'Contact')}<p>Questions about this page: <a href="mailto:${EMAIL}">${EMAIL}</a>. If this page changes, the date at the top changes with it.</p>
</div></section>`, tipsBand: false });
}

// ---------------------------------------------------------------- calendar (one month at a time; site.js steps between months)
export function calendar() {
  const ev = all().filter((v) => v.kind === 'event' && v.startRaw);
  const month = today.slice(0, 7);
  const span = (v: V) => { const out: string[] = []; for (let k = v.date; k <= (v.endDate || v.date) && out.length < 62; k = addDays(k, 1)) out.push(k); return out; };
  const months = [...new Set([month, ...ev.flatMap((v) => span(v).map((k) => k.slice(0, 7)))])].sort();
  const mlabel = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const grid = (m: string) => {
    const first = `${m}-01`, d0 = new Date(`${first}T12:00:00Z`), start = addDays(first, -((d0.getUTCDay() + 6) % 7));
    const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter((k, i) => i < 35 || k.slice(0, 7) === m);
    const mine = ev.filter((v) => span(v).some((k) => k.slice(0, 7) === m)).sort((a, b) => (a.startRaw < b.startRaw ? -1 : 1));
    return `<section class="cmonth" data-m="${m}" ${m === month ? '' : 'hidden'} aria-label="${mlabel(m)}"><div class="cgrid" role="table"><div class="cwk" role="row">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span role="columnheader">${d}</span>`).join('')}</div>
<div class="cdays">${cells.map((k) => { const es = mine.filter((v) => v.date <= k && (v.endDate || v.date) >= k); return `<div class="cday ${k.slice(0, 7) !== m ? 'out' : ''} ${k === today ? 'now' : ''} ${es.length ? 'has' : ''}" role="cell"><b>${+k.slice(8)}</b>${es.map((v) => `<a href="${v.href}" class="${v.free ? 'free' : ''}">${esc(v.name)}</a>`).join('')}</div>`; }).join('')}</div></div>
<div class="clist">${mine.length ? agendaRows(mine) : `<p class="nothing">Nothing on the calendar for ${mlabel(m)} yet.</p>`}</div></section>`;
  };
  return shell({ body: `${pghead('Events calendar', 'Every event we’ve covered across Benton and Washington counties, a month at a time. Subscribe once and new events show up in your calendar on their own.')}
<section class="wrap rv cal"><div class="chead"><h2 class="cml" aria-live="polite">${mlabel(month)}</h2><div class="arrows"><button type="button" class="arw" data-cm="-1" aria-label="Earlier month">${I.left}</button><button type="button" class="arw" data-cm="1" aria-label="Later month">${I.arrow}</button></div>
${subButtons('acts subs')}</div>
${months.map(grid).join('')}${data('months', months.map((m) => [m, mlabel(m)]))}</section>` });
}

// ---------------------------------------------------------------- guides
const guideList = () => [...getGuides().map((g) => ({ href: `/guides/${g.slug}/`, t: g.title, s: g.summary })), { href: '/guides/free-things-to-do/', t: 'Free things to do', s: 'Free outings and events we’ve covered across the area.' }, { href: '/calendar/', t: 'Events calendar', s: 'Every event by month. Subscribe in Apple, Google or Outlook.' }];
const COLORS = ['clay', 'ink', 'moss', 'paper'];
const guideCards = (list: { href: string; t: string; s: string }[]) => `<div class="gcards">${list.map((g, i) => `<a class="gcard ${COLORS[i % 4]}" href="${g.href}"><h3>${esc(g.t)}</h3><p>${esc(g.s)}</p>${I.tar}</a>`).join('')}</div>`;
const directory = () => { const { groups } = getResources(); return `<section class="sec wrap rv dir" id="directory">${secHead('Local directory')}<nav class="anchors" aria-label="Directory sections">${groups.map((g) => `<a href="#${slugify(g.title)}">${esc(g.title)}</a>`).join('')}</nav>
${groups.map((g) => `<section class="dgroup" id="${slugify(g.title)}"><div><h3>${esc(g.title)}</h3><p>${esc(g.blurb)}</p></div><ul class="dlinks">${g.links.map((l) => `<li><a href="${esc(l.url)}" ${ext}><b>${esc(l.name)}</b>${l.note || l.city ? `<span>${esc(l.note || l.city || '')}</span>` : ''}</a></li>`).join('')}</ul></section>`).join('')}
<p class="nothing">Missing something useful? ${B('Suggest a link', { cls: 'line sm', attrs: 'data-open="tip"' })}</p></section>`; };
export const guides = () => shell({ body: `${pghead('Guides and resources', esc(getResources().intro))}<section class="wrap rv">${guideCards(guideList())}</section>${directory()}` });
export function guide(slug: string) {
  const g = getGuides().find((x) => x.slug === slug)!;
  return shell({ body: `${pghead(g.title, esc(g.summary))}<section class="wrap rv reading"><div class="prose">${g.html}</div><aside class="rail"><h2>More guides</h2>${guideCards(guideList().filter((x) => x.href !== `/guides/${slug}/`).slice(0, 3))}</aside></section>` });
}
export function freeGuide() {
  const up = upcoming().filter((v) => v.free), past = pastEvents().filter((v) => v.free).slice(0, 9);
  return shell({ body: `${pghead('Free things to do', 'Free events and outings across Benton and Washington counties. No ticket, no cover.')}
<section class="sec wrap rv tight">${secHead('Coming up')}${up.length ? `<div class="agenda solo">${agendaRows(up)}</div>` : `<p class="nothing">Nothing free on the calendar right now. We add events as soon as we confirm them.</p>`}</section>
${past.length ? `<section class="sec wrap rv">${secHead('Free things we’ve covered')}<div class="spots">${past.map((v) => spotCard(v, '30vw', '', 'Free')).join('')}</div></section>` : ''}` });
}

// ---------------------------------------------------------------- places and topics
export const placeStats = () => PLACES.map((p) => ({ ...p, list: all().filter((v) => v.a && placeOf(v) === p.slug) })).filter((p) => p.list.length >= 2);
const placeOf = (v: V) => PLACES.find((p) => p.match.some((re) => re.test(`${v.a.title} ${v.a.text}`)))?.slug;
export const places = () => shell({ body: `${pghead('Places we cover often', 'The venues that keep turning up in our stories, with what’s on at each.')}
<section class="wrap rv"><div class="spots grid3">${placeStats().map((p) => { const pic = p.list.find((v) => v.image); const n = upcoming().filter((v) => placeOf(v) === p.slug).length;
  return `<article class="spot place"><div class="ph">${pic ? img(pic.image, '30vw', 800, false, pic.alt) : `<span class="noph">${esc(p.name)}</span>`}</div><h3><a href="/places/${p.slug}/">${esc(p.name)}</a></h3><p>${esc(p.city)} · ${p.list.length} stories${n ? ` · ${n} coming up` : ''}</p><p class="pb">${esc(p.blurb)}</p></article>`; }).join('')}</div></section>` });
export function place(slug: string) {
  const p = placeBySlug(slug)!, list = all().filter((v) => placeOf(v) === slug), up = list.filter((v) => v.kind === 'event' && v.upcoming), rest = list.filter((v) => !(v.kind === 'event' && v.upcoming));
  return shell({ body: `${pghead(p.name, `${esc(p.blurb)} <span class="small">${esc(p.city)}</span>`)}
<section class="sec wrap rv tight">${secHead(`What’s on at ${p.name}`)}${up.length ? `<div class="agenda solo">${agendaRows(up)}</div>` : `<p class="nothing">Nothing coming up here yet.</p>`}</section>
${rest.length ? `<section class="sec wrap rv">${secHead('Stories from here')}<div class="spots">${rest.map((v) => spotCard(v, '30vw', '', '')).join('')}</div></section>` : ''}` });
}
export function topic(t: Topic) {
  const list = all().filter((v) => v.topic === t.name);
  return shell({ body: `${pghead(t.h1, esc(t.blurb))}<section class="wrap newsgrid rv">${list.map((v, i) => newsItem(v, i === 0)).join('')}${list.length ? '' : '<p class="nothing">Nothing here yet.</p>'}</section>
<section class="sec wrap rv"><div class="sec-head"><h2>More topics</h2></div><p class="chips">${TOPICS.filter((x) => x.slug !== t.slug && all().some((v) => v.topic === x.name)).map((x) => `<a href="${x.href}">${esc(x.h1)}</a>`).join('')}</p></section>` });
}

// ---------------------------------------------------------------- search (site.js loads /search-index.json)
export const search = () => shell({ body: `<section class="wrap pghead rv"><h1 class="split">${split('Search')}</h1><form class="sform" role="search" action="/search/"><label class="vh" for="q">Search NWA Next</label>${I.search}<input id="q" name="q" type="search" placeholder="Tacos, Bentonville, free, this weekend" autocomplete="off"><button type="submit" class="btn clay">${lb('Search')}</button></form></section>
<section class="wrap rv"><p class="sstat" aria-live="polite"></p><ul class="sres"></ul>
<div class="shint"><h2>Try</h2><p class="chips"><a href="/search/?q=free">free</a><a href="/search/?q=music">music</a><a href="/search/?q=coffee">coffee</a><a href="/search/?q=Bentonville">Bentonville</a><a href="/search/?q=Fayetteville">Fayetteville</a><a href="/openings/">new spots</a></p></div></section>`, tipsBand: false });

// ---------------------------------------------------------------- connect, newsletter, submit
export function connect() {
  const s = getSite(), { groups } = getResources();
  const ways = [
    ['clay', 'Get the newsletter', s.newsletter.pitch, B('Sign up', { cls: 'paper', href: '/newsletter/' })],
    ['ink', 'Follow along', 'New openings and events land on Instagram first.', B(`@${s.instagramHandle}`, { cls: 'paper', href: s.instagram, icon: I.ig })],
    ['moss', 'Go to something free', 'Museum nights, outdoor movies, festivals and markets. We keep a running list.', B('Free things to do', { cls: 'paper', href: '/guides/free-things-to-do/' })],
    ['paper', 'Tell us what we missed', `Opening, closing or happening and we haven’t covered it? Send a tip or email ${EMAIL}.`, B('Send a tip', { cls: 'clay', attrs: 'data-open="tip"' })],
  ];
  const pickG = (t: string) => groups.find((g) => g.title === t);
  return shell({ body: `${pghead('Get connected', 'The fastest way to feel at home here is to show up to things. Here’s how to find them, and how to reach us.')}
<section class="wrap rv"><div class="ways">${ways.map(([c, t, l, a]) => `<div class="way ${c}"><h2>${esc(t)}</h2><p>${esc(l)}</p>${a}</div>`).join('')}</div></section>
${['Give and volunteer', 'Things to do'].map(pickG).filter(Boolean).map((g) => `<section class="sec wrap rv dir"><section class="dgroup"><div><h3>${esc(g!.title)}</h3><p>${esc(g!.blurb)}</p></div><ul class="dlinks">${g!.links.map((l) => `<li><a href="${esc(l.url)}" ${ext}><b>${esc(l.name)}</b>${l.note || l.city ? `<span>${esc(l.note || l.city || '')}</span>` : ''}</a></li>`).join('')}</ul></section></section>`).join('')}
<section class="sec wrap rv"><p class="nothing">More local links: ${B('City halls, libraries and getting around', { cls: 'line sm', href: '/guides/#directory', icon: I.arrow })}</p></section>` });
}
export function newsletterPage() {
  return shell({ letterBand: false, body: `<section class="letter solo" id="letter"><div class="wrap">
<div class="lhead"><h1 class="split">${wd(['Find', 'out', 'what’s', 'next<span class="pd">.</span>'], 3)}</h1>${badge('live')}</div>
<div class="lrow"><p>${esc(getSite().newsletter.pitch)} Free, and you can leave any time.</p>${newsletterForm('em2')}<p class="ok" role="status" hidden>You’re on the list. Look out for the first one.</p></div></div></section>
<section class="sec wrap rv">${secHead('Recent stories', ['/news/', 'All news'])}<div class="spots">${latest().slice(0, 3).map((v) => spotCard(v, '30vw', '', v.kind === 'opening' ? 'New spot' : '')).join('')}</div></section>` });
}
export function submit() {
  return shell({ tipsBand: false, body: `${pghead('Send a tip', `Know about a new spot, an event or something changing in Benton or Washington county? Tell us here, or email <a href="mailto:${EMAIL}">${EMAIL}</a>. ${esc(SOURCING)}`)}
<section class="wrap rv subgrid"><div class="subform">${tipForm(false)}</div><div class="subside"><div class="subcard"><h2>What helps</h2><ul><li>What it is, and where</li><li>The date and time, if it’s an event</li><li>A link to a website, post or listing</li><li>Your email, if you’re happy for us to follow up</li></ul><p>Rather email? <a href="mailto:${EMAIL}">${EMAIL}</a></p></div><p class="small">Found a mistake in a story? Use the form or email us, and we’ll fix it.</p></div></section>` });
}

// ---------------------------------------------------------------- the Instagram links page (no site chrome)
export function links() {
  const s = getSite(), n = upcoming().length;
  const L: [string, string, string][] = [['/events/', n ? `This week in NWA · ${n} coming up` : 'What’s on in NWA', 'clay'], ['/openings/', 'New spots', 'ink'], ['/newsletter/', 'Get the newsletter', 'moss'], ['/submit/', 'Send us a tip', 'line'], ['/', 'nwanext.com', 'line']];
  return `<main id="main" class="lnk"><header>${badge('live')}<h1 class="vh">NWA Next</h1><p>${esc(TAG[0])}<br><b>${esc(TAG[1])}</b></p></header>
<nav class="lbtns" aria-label="NWA Next links">${L.map(([h, t, c]) => B(t, { cls: `${c} big`, href: h })).join('')}</nav>
<section class="llatest"><h2>Latest</h2><ul>${latest().slice(0, 3).map((v) => `<li><a href="${v.href}">${img(v.image, '72px', 240, false, v.alt)}<span><b>${esc(short(v.title, 70))}</b><span>${esc(v.city)} · ${v.posted}</span></span></a></li>`).join('')}</ul></section>
<p class="lfoot"><a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="${esc(s.instagram)}">@${esc(s.instagramHandle)}</a></p>
<a class="lmark" href="/" aria-label="nwa next, home">${mark('horizontal-small', INK, CLAY, 'ls')}</a></main>`;
}

// ---------------------------------------------------------------- 404
export const notFound = () => shell({ body: `${pghead('That page isn’t here.', 'It may have moved, or the link has a typo. These are a good place to start.')}<section class="wrap rv"><div class="acts">${B('What’s on', { cls: 'clay', href: '/events/', icon: I.arrow })}${B('New spots', { cls: 'ink', href: '/openings/' })}${B('Search', { cls: 'line', href: '/search/', icon: I.search })}</div></section>`, tipsBand: false });
