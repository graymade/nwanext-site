// Blocks shared by several pages: the hero, the "Show me ... in ..." agenda, weekends, cards and the towns list.
import { addDays } from '../now';
import { subscribeLinks } from '../ics';
import { B, CITIES, I, WHAT, calMenu, cityUrl, data, esc, factsDl, img, label, lb, more, pick, pickMenu, save, short, showDay, split, today, townOpts, upcoming, when, wd, type V } from './kit';

// ---------------------------------------------------------------- hero
// Slides: stories marked featured in the CMS first, then the soonest upcoming events, then the newest stories. Four at most, photos only.
export function heroSlides(list: V[]) {
  const withPic = list.filter((v) => v.image);
  const up = upcoming().filter((v) => v.image);
  const order = [...withPic.filter((v) => v.featured && (v.kind !== 'event' || v.upcoming)), ...up, ...withPic.filter((v) => v.kind !== 'event')];
  return [...new Map(order.map((v) => [v.slug, v])).values()].slice(0, 4);
}
const kindLabel = (v: V) => (v.kind === 'event' ? (v.upcoming ? 'Worth going' : 'Event') : v.kind === 'opening' ? 'New spot' : 'News');
export const hero = (slides: V[]) => `<section class="hero" aria-roledescription="carousel" aria-label="Worth knowing this week"><h1 class="vh">NWA Next: new eats, events and openings across Northwest Arkansas</h1>
<div class="slides">${slides.map((v, i) => `<article class="slide ${i === 0 ? 'on' : ''}" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}" ${i ? 'aria-hidden="true" inert' : ''}>
<div class="sph">${img(v.image, '100vw', 1600, i === 0, v.alt)}</div><div class="copy">${label(kindLabel(v))}<h2 class="${v.title.length > 44 ? 'long' : ''}"><a href="${v.href}">${esc(v.title)}</a></h2>
<div class="factbar">${v.kind === 'event' && v.upcoming
  ? `<dl><dt>When</dt><dd>${when(v)}</dd></dl><dl><dt>Where</dt><dd>${esc(v.at)}</dd></dl>${v.price ? `<dl><dt>Cost</dt><dd>${esc(v.price.split(' ')[0])}${v.ages ? ` · ${esc(v.ages)}` : ''}</dd></dl>` : ''}
<div class="acts">${calMenu(v, 'clay')}${save(v, 'photo')}${B('Details', { cls: 'photo', href: v.href })}</div>`
  : `<dl><dt>Where</dt><dd>${esc(v.at)}</dd></dl><dl><dt>Posted</dt><dd>${v.posted}</dd></dl><div class="acts">${B('Read the story', { cls: 'clay', href: v.href, icon: I.arrow })}</div>`}</div></div></article>`).join('')}</div>
<div class="hctl wrap"><div class="tabs" role="tablist" aria-label="Pick a story">${slides.map((v, i) => `<button type="button" role="tab" class="tab" aria-selected="${i === 0}" data-i="${i}"><span class="bar"><i></i></span><span class="tt">${v.kind === 'event' && v.upcoming ? `${v.day} · ` : ''}${esc(v.name)}</span></button>`).join('')}</div>
<button type="button" class="arw pause" aria-label="Pause the slideshow" aria-pressed="false">${I.pause}</button></div></section>`;

// ---------------------------------------------------------------- the agenda
const evRow = (v: V) => `<details class="ev" data-city="${esc(v.city)}" data-c="${v.cat}" data-date="${showDay(v)}">
<summary><span class="t">${v.startT}</span><span class="m"><span class="n">${esc(v.name)}</span><span class="w">${esc(v.at)}${v.price ? ` · ${v.price === 'Free' ? '<span class="free">Free</span>' : esc(v.price.split(' ')[0])}` : ''}</span></span>${img(v.image, '96px', 240)}<span class="chev" aria-hidden="true"></span></summary>
<div class="evx"><p class="sum">${esc(v.summary)}</p>${factsDl(v)}<div class="acts">${calMenu(v, 'clay')}${save(v)}${v.tickets ? B('Tickets', { cls: 'line', href: v.tickets, attrs: 'target="_blank" rel="noopener"' }) : ''}${more(v.href)}</div></div></details>`;
export const agendaRows = (list: V[]) => {
  const groups: { k: string; v: V; items: V[] }[] = [];
  for (const v of list) { const k = showDay(v); const g = groups.find((x) => x.k === k); if (g) g.items.push(v); else groups.push({ k, v, items: [v] }); }
  return groups.map((g) => { const d = new Date(`${g.k}T12:00:00Z`), o = (x: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', { timeZone: 'UTC', ...x });
    return `<section class="day" data-date="${g.k}"><h3 class="dayh"><b>${o({ day: 'numeric' })}</b> ${o({ weekday: 'long' })}, ${o({ month: 'short' })}</h3>${g.items.map(evRow).join('')}</section>`; }).join('');
};
// Subscribe to every event: Apple (webcal), Google and Outlook web, from lib/ics.ts.
export const subButtons = (cls = 'acts') => { const L = subscribeLinks('/calendar.ics'); return `<div class="${cls}">${B('Apple', { cls: 'line sm', href: L.apple, icon: I.cal })}${B('Google', { cls: 'line sm', href: L.google, attrs: 'target="_blank" rel="noopener"' })}${B('Outlook', { cls: 'line sm', href: L.outlook, attrs: 'target="_blank" rel="noopener"' })}</div>`; };
export const plansPanels = () => `<aside class="side">
<div class="plansp" id="plans"><h3>My plans <b class="pc">0</b></h3><ul></ul><p class="pe">Tap Save on anything you want to go to. It stays on this device, no account needed.</p>${B('Add all to my calendar', { cls: 'clay allcal', icon: I.cal })}</div>
<div class="subp"><h3>Every event, in your calendar</h3><p>Subscribe once and new events show up on their own.</p>${subButtons()}</div></aside>`;
const wkLabel = () => { const d = new Date(`${today}T12:00:00Z`), mon = addDays(today, -((d.getUTCDay() + 6) % 7)), sun = addDays(mon, 6), f = (k: string, o: Intl.DateTimeFormatOptions) => new Date(`${k}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
  return `${f(mon, { month: 'short', day: 'numeric' })}–${mon.slice(5, 7) === sun.slice(5, 7) ? f(sun, { day: 'numeric' }) : f(sun, { month: 'short', day: 'numeric' })}`; };
// Event data for site.js (week strip, plans, calendar files).
export const evData = (list: V[]) => data('ev', { now: today, ev: list.map((v) => ({ id: v.slug, t: v.name, s: v.icsS, e: v.icsE, l: v.full, u: `https://nwanext.com${v.href}`, d: `${v.day}, ${v.mon} ${v.dnum}`, date: showDay(v), city: v.city, c: v.cat })) });
export const onBlock = (hTag = 'h2', id = 'on') => { const up = upcoming(); return `<section class="wrap ask rv" id="${id}"><${hTag} class="askh split">${wd(['Show', 'me', pick('what', WHAT, 'What'), 'in', pick('town', townOpts(up), 'Town')])}</${hTag}>
${pickMenu('what', WHAT, 'Pick what')}${pickMenu('town', townOpts(up), 'Pick a town')}
<div class="wknav"><p class="wkl" aria-live="polite"><small>This week</small> <b>${wkLabel()}</b></p><button type="button" class="arw" data-wk="-1" aria-label="Previous week">${I.left}</button><button type="button" class="arw" data-wk="1" aria-label="Next week">${I.arrow}</button><button type="button" class="clear" hidden>Show the whole week</button></div>
<div class="strip" role="group" aria-label="Pick a day"></div></section>
<section class="wrap layout"><div class="agenda">${agendaRows(up)}<div class="empty" hidden><p>${up.length ? 'Nothing posted for that yet.' : 'Nothing on the calendar yet.'} We add events as soon as we confirm them.</p><div class="acts">${B('Jump to the next week with events', { cls: 'line', attrs: 'data-jump', icon: I.arrow })}${B('Tell us about an event', { cls: 'line', attrs: 'data-open="tip" data-kind="event"' })}${up.length ? '' : B('See new spots', { cls: 'ink', href: '/openings/', icon: I.arrow })}</div></div></div>${plansPanels()}</section>
${evData(up)}`; };

// ---------------------------------------------------------------- weekends (the next five, from today)
const wkRow = (v: V) => `<li><a href="${v.href}">${img(v.image, '56px', 240)}<span><b>${esc(v.name)}</b><span>${v.day} · ${v.startT} · ${esc(v.city)}${v.free ? ' · <span class="free">Free</span>' : ''}</span></span></a></li>`;
export function weekendsBlock() {
  const up = upcoming(); if (!up.length) return '';
  const d = new Date(`${today}T12:00:00Z`).getUTCDay(), fri = d === 0 ? addDays(today, -2) : d === 6 ? addDays(today, -1) : addDays(today, 5 - d);
  const f = (k: string, o: Intl.DateTimeFormatOptions) => new Date(`${k}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
  const rng = (a: string, b: string) => `${f(a, { month: 'short', day: 'numeric' })}–${a.slice(5, 7) === b.slice(5, 7) ? f(b, { day: 'numeric' }) : f(b, { month: 'short', day: 'numeric' })}`;
  const W = Array.from({ length: 5 }, (_, i) => { const a = addDays(fri, i * 7), c = addDays(a, 2); return { h: i === 0 ? 'This weekend' : i === 1 ? 'Next weekend' : rng(a, c), sub: i < 2 ? rng(a, c) : '', a, c }; });
  return `<section class="sec wrap rv wkends"><div class="sec-head"><h2>Plan your weekends</h2><div class="arrows"><button type="button" class="arw" data-car="-1" aria-label="Earlier weekends">${I.left}</button><button type="button" class="arw" data-car="1" aria-label="Later weekends">${I.arrow}</button></div></div>
<div class="car">${W.map((w, i) => { const ev = up.filter((v) => showDay(v) >= w.a && showDay(v) <= w.c);
  return `<article class="wkc ${i === 0 ? 'now' : ''}" data-n="${ev.length}"><h3>${w.h}</h3><p class="wks">${w.sub ? w.sub + ' · ' : ''}<span class="cnt">${ev.length ? `${ev.length} worth going to` : 'Nothing posted yet'}</span></p>
<ul>${ev.slice(0, 4).map(wkRow).join('')}</ul>${ev.length ? '' : '<p class="none">We add events as soon as we confirm them.</p>'}
${more(`/events/?from=${w.a}&to=${w.c}`, ev.length > 4 ? `See all ${ev.length}` : 'Open the weekend')}</article>`; }).join('')}</div></section>`;
}

// ---------------------------------------------------------------- cards
export const spotCard = (v: V, sizes = '30vw', cls = '', tag = 'New spot') => `<article class="spot ${cls}" data-city="${esc(v.city)}"><div class="ph">${tag ? label(tag) : ''}${img(v.image, sizes, 1200, false, v.alt)}${v.image ? '' : `<span class="noph">${esc(v.city)}</span>`}</div><h3><a href="${v.href}">${esc(short(v.title, 80))}</a></h3><p>${esc(v.city)} · ${v.kind === 'event' ? `${v.day}, ${v.mon} ${v.dnum}` : v.posted}</p></article>`;
export const newsItem = (v: V, lead = false) => `<article class="nw ${lead ? 'lead' : ''}" data-city="${esc(v.city)}"><div class="ph">${img(v.image, lead ? '(max-width:800px) 100vw, 55vw' : '160px', lead ? 1200 : 480, false, v.alt)}${v.image ? '' : `<span class="noph">${esc(v.city)}</span>`}</div><div><h2><a href="${v.href}">${esc(v.title)}</a></h2>${v.summary ? `<p class="sum">${esc(v.summary)}</p>` : ''}<p class="meta">${esc(v.city)} · ${v.kind === 'event' ? `${v.dayLong}, ${v.mon} ${v.dnum}` : v.posted}</p></div></article>`;
export const around = (list: V[]) => `<div class="around">${list.map((v) => `<a href="${v.href}"><h3>${esc(short(v.title, 72))}</h3><span>${esc(v.city)}</span></a>`).join('')}</div>`;
export const secHead = (h: string, link?: [string, string], tag = 'h2') => `<div class="sec-head"><${tag}>${esc(h)}</${tag}>${link ? `<a href="${link[0]}">${lb(link[1])}</a>` : ''}</div>`;

// ---------------------------------------------------------------- towns list (dark band)
export const countsFor = (list: V[], name: string) => list.filter((v) => v.city === name).length;
export const townsBlock = (list: V[], h = 'Pick a town', tag = 'h2') => `<section class="sec wrap dark rv towns">${secHead(h, tag === 'h2' ? ['/cities/', 'See the map'] : undefined, tag)}
<p class="townlist">${CITIES().map((c) => { const n = countsFor(list, c.name); return `<a href="${cityUrl(c.name)}" class="${n ? 'f' : ''}">${esc(c.name)}${n ? `<sup>${n}</sup>` : ''}</a>`; }).join(' ')}</p></section>`;

// A page header with the oversized title. `title` may already hold markup (pickers).
export const pghead = (title: string, lede = '', raw = false, extra = '') => `<section class="wrap pghead rv"><h1 class="split">${raw ? title : split(title)}</h1>${extra}${lede ? `<p class="lede">${lede}</p>` : ''}</section>`;
