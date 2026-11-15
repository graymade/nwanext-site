// Headless QA for the Pocket build. System Chrome through playwright-core, never a visible window.
// Usage: node scripts/qa.mjs [mode] [base=http://localhost:3035]
// Modes: pages sheet scope filters tabs days month phonecal subscribe search calendar keys hover reduce weight jsonld links widths empty all
// Run against `npm run dev:preview` (NWA_NOW=2026-09-21) except `empty`, which wants a real-date server.
// Writes screenshots to qa/ and prints one line per check.
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const [mode = 'all', BASE = 'http://localhost:3035'] = process.argv.slice(2);
const OUT = 'qa';
fs.mkdirSync(OUT, { recursive: true });

const EVENT = '/news/the-momentary-brings-cure-for-paranoia-to-bentonville-on-tuesday-sept/';
const OPENING = '/news/flyway-brewing-is-open-at-walmarts-home-office-campus-in-bentonville/';
const PAGES = [
  ['home', '/'],
  ['events', '/events/'],
  ['calendar', '/calendar/'],
  ['openings', '/openings/'],
  ['news', '/news/'],
  ['story-event', EVENT],
  ['story-opening', OPENING],
  ['story-landscape', '/news/pottery-on-the-patio/'],
  ['story-past', '/news/the-momentary-brings-the-aux-arc-record-fair-to-r-de-house-on-sunday/'],
  ['story-news', '/news/kristy-lane-repaving-starts-monday/'],
  ['cities', '/cities/'],
  ['city-fayetteville', '/cities/fayetteville/'],
  ['city-farmington', '/cities/farmington/'],
  ['city-siloam-springs', '/cities/siloam-springs/'],
  ['topic-food', '/topics/food-and-drink/'],
  ['places', '/places/'],
  ['place-momentary', '/places/the-momentary/'],
  ['guides', '/guides/'],
  ['guide-new-to-nwa', '/guides/new-to-nwa/'],
  ['guide-free', '/guides/free-things-to-do/'],
  ['connect', '/connect/'],
  ['newsletter', '/newsletter/'],
  ['submit', '/submit/'],
  ['about', '/about/'],
  ['credits', '/credits/'],
  ['search', '/search/?q=momentary'],
  ['links', '/links/'],
  ['404', '/this-page-is-not-here/'],
];
const WIDTHS = [1440, 1024, 768, 390];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctxFor = (w, extra = {}) => {
  const phone = w < 700;
  return browser.newContext({
    viewport: { width: w, height: phone ? 844 : 900 },
    deviceScaleFactor: phone ? 2 : 1,
    isMobile: phone,
    hasTouch: phone,
    ...extra,
  });
};
const watch = (page, is404 = false) => {
  const errors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // The 404 page's own document request logs a 404 resource error. That one is expected.
    if (is404 && /404/.test(m.text())) return;
    errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
};
// Scroll the page through so lazy images load, then wait (up to 6s) until every shown image has
// loaded and faded in (the boot script marks loaded images with data-in).
const settle = (page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    const shown = () => [...document.querySelectorAll('img')].filter((i) => i.getClientRects().length && !i.closest('dialog:not([open]), [popover]:not(:popover-open)'));
    for (let t = 0; t < 60 && shown().some((i) => !i.hasAttribute('data-in')); t++) await new Promise((r) => setTimeout(r, 100));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 350));
  });

// Nested scroll: no element may scroll up and down inside the page unless it is an intended panel
// (dialogs, sheets, the search body, filter and town popovers, the sticky sidebar on wide screens).
const PANELS = '.side__inner, .search__body, .more__body, .fsheet__body, .fpanel__body, .towns__body';
const nestedScroll = (page) =>
  page.evaluate((panels) => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('dialog:not([open]), [popover]:not(:popover-open)') || el.matches(panels)) continue;
      const cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowY) || !el.getClientRects().length) continue;
      if (el.scrollHeight > el.clientHeight + 1) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}:${el.scrollHeight}/${el.clientHeight}`);
    }
    return out;
  }, PANELS);
const results = [];
const log = (...a) => { const line = a.join(' '); results.push(line); console.log(line); };
const isOpen = (page, sel = 'dialog.search') => page.evaluate((s) => !!document.querySelector(s)?.open, sel);
const path = (page) => new URL(page.url()).pathname;

async function pages() {
  for (const w of WIDTHS) {
    const ctx = await ctxFor(w);
    for (const [name, p] of PAGES) {
      const page = await ctx.newPage();
      const errors = watch(page, name === '404');
      const res = await page.goto(BASE + p, { waitUntil: 'networkidle' });
      await settle(page);
      await page.waitForTimeout(1200);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const info = await page.evaluate(() => {
        // Visible text smaller than 15px, ignoring the logo and visually hidden text.
        const bad = new Set();
        for (const el of document.querySelectorAll('body *')) {
          if (!el.childNodes.length || el.closest('svg, .sr-only, script, style, dialog:not([open]), [popover]:not(:popover-open)')) continue;
          const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (!own) continue;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getClientRects().length) continue;
          if (parseFloat(cs.fontSize) < 15) bad.add(`${el.tagName.toLowerCase()}.${el.className}:${cs.fontSize}`);
        }
        const h1 = document.querySelectorAll('h1').length;
        const crumbs = !!document.querySelector('nav[aria-label="Breadcrumb"] ol [aria-current="page"]');
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
        const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
        return { small: [...bad].slice(0, 4), h1, crumbs, title: document.title, canonical, robots };
      });
      const nested = await nestedScroll(page);
      await page.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: true });
      const crumbOk = name === 'home' || name === 'links' || name === '404' || info.crumbs;
      log(`page ${name} ${w} status:${res?.status()} overflowX:${overflow} h1:${info.h1} crumbs:${crumbOk} nestedScroll:${nested.length ? JSON.stringify(nested) : 'none'} errors:${errors.length ? JSON.stringify(errors.slice(0, 2)) : 'none'}${info.small.length ? ' small:' + info.small.join(',') : ''}${w === 1440 ? ` title:"${info.title}" canonical:${info.canonical}${info.robots ? ' robots:' + info.robots : ''}` : ''}`);
      await page.close();
    }
    await ctx.close();
  }
}

async function sheet() {
  // Stories open their full page (no sheet over the list). Back returns to the list.
  for (const w of [1440, 390]) {
    const ctx = await ctxFor(w);
    const page = await ctx.newPage();
    const errors = watch(page);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('nwa-city'));
    await page.reload({ waitUntil: 'networkidle' });
    const link = page.locator('.feed .post__title a').nth(1);
    const href = await link.getAttribute('href');
    await link.click();
    await page.waitForURL((u) => u.pathname === href, { timeout: 15000 }).catch(() => {});
    await page.waitForSelector('main .story h1', { timeout: 15000 }).catch(() => {});
    const s1 = await page.evaluate(() => ({ sheet: !!document.querySelector('dialog.sheet'), h1: document.querySelector('main .story h1')?.textContent?.slice(0, 50), crumbs: !!document.querySelector('main nav[aria-label="Breadcrumb"]') }));
    await page.screenshot({ path: `${OUT}/story-open-${w}.png` });
    log(`story ${w} click-opens-page url:${path(page)} expected:${href} ${JSON.stringify(s1)} pass:${path(page) === href && !s1.sheet && !!s1.h1 && s1.crumbs}`);

    await page.goBack();
    await page.waitForTimeout(800);
    log(`story ${w} back url:${path(page)} pass:${path(page) === '/'}`);

    const [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null), page.locator('.feed .post__title a').nth(1).click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] })]);
    await page.waitForTimeout(400);
    log(`story ${w} modifier-click newTab:${popup ? new URL(popup.url()).pathname : 'none'} stays:${path(page)} pass:${!!popup && path(page) === '/'} errors:${errors.length ? JSON.stringify(errors.slice(0, 3)) : 'none'}`);
    if (popup) await popup.close();
    await ctx.close();
  }
}

async function scope() {
  // "My city": the town picker saves any town, including ones outside the featured five, and the
  // filter bar starts from it until the reader changes the City filter.
  for (const w of [1440, 390]) {
    const ctx = await ctxFor(w);
    const page = await ctx.newPage();
    const errors = watch(page);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('nwa-city'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator(w < 700 ? '.topbar__scope' : '.yourcity .link-btn').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/towns-picker-${w}.png` });
    const towns = await page.evaluate(() => ({ items: document.querySelectorAll('#town-pick .towns__item').length, counties: [...document.querySelectorAll('#town-pick .towns__county')].map((c) => c.textContent) }));
    await page.locator('#town-pick .towns__item', { hasText: 'Rogers' }).click();
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ saved: localStorage.getItem('nwa-city'), chips: [...document.querySelectorAll('.fbar__active .fchip span:first-child')].map((x) => x.textContent), count: document.querySelector('.fbar__count')?.textContent, url: location.search }));
    await page.screenshot({ path: `${OUT}/scope-rogers-home-${w}.png` });
    log(`scope ${w} picker ${JSON.stringify(towns)} rogers ${JSON.stringify(r)} pass:${r.saved === 'rogers' && r.chips.includes('Rogers (your city)') && r.url === ''}`);
    await page.goto(BASE + '/events/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const ev = await page.evaluate(() => ({ chips: [...document.querySelectorAll('.fbar__active .fchip span:first-child')].map((x) => x.textContent), rows: [...new Set([...document.querySelectorAll('.agenda .arow')].map((r) => r.querySelector('.arow__where span')?.textContent))] }));
    log(`scope ${w} events-follow-saved ${JSON.stringify(ev)} pass:${ev.chips.includes('Rogers (your city)')}`);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator(w < 700 ? '.topbar__scope' : '.yourcity .link-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#town-pick .towns__input').fill('pea');
    await page.waitForTimeout(200);
    await page.locator('#town-pick .towns__item', { hasText: 'Pea Ridge' }).click();
    await page.waitForTimeout(600);
    const pea = await page.evaluate(() => ({ saved: localStorage.getItem('nwa-city'), empty: document.querySelector('.quiet__line')?.textContent, top: document.querySelector('.topbar__scope-name')?.textContent, side: document.querySelector('.yourcity strong')?.textContent }));
    await page.screenshot({ path: `${OUT}/scope-pea-ridge-home-${w}.png` });
    log(`scope ${w} pea-ridge ${JSON.stringify(pea)} pass:${pea.saved === 'pea-ridge' && /Pea Ridge/.test(pea.empty || '')} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
    await page.evaluate(() => localStorage.removeItem('nwa-city'));
    await ctx.close();
  }
}

// The filter system on home, all stories and a city page, at 1440 and 390.
async function filters() {
  const st = (page) => page.evaluate(() => ({
    count: document.querySelector('.fbar__count')?.textContent,
    chips: [...document.querySelectorAll('.fbar__active .fchip')].map((x) => x.textContent.replace('Remove', '').trim()),
    url: decodeURIComponent(location.search),
    items: document.querySelectorAll('.feed .post:not([hidden]), .feed .post').length,
  }));
  for (const w of [1440, 390]) {
    const phone = w < 700;
    for (const [name, path, lockedCity] of [['home', '/', false], ['news', '/news/', false], ['city', '/cities/fayetteville/', true]]) {
      const ctx = await ctxFor(w);
      const page = await ctx.newPage();
      const errors = watch(page);
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.removeItem('nwa-city'));
      await page.reload({ waitUntil: 'networkidle' });
      log(`filters ${name} ${w} start ${JSON.stringify(await st(page))}`);
      const open = async (facet) => {
        if (phone) { await page.locator('.fbar__sheetbtn').click(); await page.waitForTimeout(350); }
        else { await page.locator('.fbtn', { hasText: facet }).first().click(); await page.waitForTimeout(250); }
      };
      const scopeSel = phone ? 'dialog.fsheet' : '.fpanel:popover-open';
      const closeIt = async () => { if (phone) await page.locator('.fsheet__go').click(); else await page.keyboard.press('Escape'); await page.waitForTimeout(350); };
      if (!lockedCity) {
        await open('City');
        await page.screenshot({ path: `${OUT}/filters-${name}-city-open-${w}.png` });
        await page.locator(`${scopeSel} .fopt`, { hasText: 'Fayetteville' }).first().click();
        await page.locator(`${scopeSel} .fopt`, { hasText: 'Bentonville' }).first().click();
        if (phone) await page.screenshot({ path: `${OUT}/filters-${name}-sheet-${w}.png` });
        await closeIt();
        log(`filters ${name} ${w} cities ${JSON.stringify(await st(page))}`);
      }
      await open('Topic');
      const topicSel = phone ? 'dialog.fsheet section:has(#fs-topic)' : '.fpanel:popover-open';
      await page.locator(`${topicSel} .fopt`, { hasText: 'Arts and music' }).first().click();
      if (!phone) await page.screenshot({ path: `${OUT}/filters-${name}-topic-open-${w}.png` });
      await closeIt();
      log(`filters ${name} ${w} +topic ${JSON.stringify(await st(page))}`);
      await open('When');
      const whenSel = phone ? 'dialog.fsheet section:has(#fs-when)' : '.fpanel:popover-open';
      await page.locator(`${whenSel} .fopt`, { hasText: 'Upcoming' }).first().click();
      await closeIt();
      if (phone) { await page.locator('.fbar__sheetbtn').click(); await page.waitForTimeout(300); await page.locator('dialog.fsheet section:has(#fs-free) .fopt').click(); await closeIt(); }
      else await page.locator('.ftoggle').click();
      await page.waitForTimeout(400);
      const full = await st(page);
      await page.screenshot({ path: `${OUT}/filters-${name}-applied-${w}.png` });
      log(`filters ${name} ${w} +when+free ${JSON.stringify(full)}`);
      await page.evaluate(() => { const b = document.querySelector('.fbar'); window.scrollTo(0, b.getBoundingClientRect().top + scrollY - 200); });
      await page.waitForTimeout(200);
      await page.locator('.fchip__x').first().click();
      await page.waitForTimeout(400);
      log(`filters ${name} ${w} remove-first ${JSON.stringify(await st(page))}`);
      const before = await st(page);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const after = await st(page);
      log(`filters ${name} ${w} reload-keeps pass:${before.url === after.url && before.count === after.count} ${JSON.stringify(after)}`);
      await page.locator('.fbar__clear').click();
      await page.waitForTimeout(400);
      const cleared = await st(page);
      log(`filters ${name} ${w} clear-all ${JSON.stringify(cleared)}`);
      if (name === 'news') {
        await page.goto(BASE + '/news/?city=rogers,fayetteville&topic=food-and-drink', { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        log(`filters news ${w} shared-url ${JSON.stringify(await st(page))}`);
        await page.goto(BASE + '/news/?category=Food%20%26%20Drink', { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        log(`filters news ${w} old-category-link ${JSON.stringify(await st(page))}`);
        await page.goto(BASE + '/news/?topic=outdoors&free=1&city=rogers', { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        const none = await page.evaluate(() => document.querySelector('.quiet__line')?.textContent);
        await page.screenshot({ path: `${OUT}/filters-empty-${w}.png` });
        log(`filters news ${w} no-match "${none}"`);
      }
      log(`filters ${name} ${w} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
      await ctx.close();
    }
  }
}

async function month() {
  const ctx = await ctxFor(1440);
  const page = await ctx.newPage();
  const errors = watch(page);
  await page.goto(BASE + '/calendar/', { waitUntil: 'networkidle' });
  const head = () => page.evaluate(() => ({ title: document.querySelector('.month-view__title')?.textContent, count: document.querySelector('.month-view__count')?.textContent, url: location.search, prev: document.querySelector('.month-view__nav .iconbtn')?.disabled, next: document.querySelectorAll('.month-view__nav .iconbtn')[1]?.disabled }));
  await page.screenshot({ path: `${OUT}/month-1440.png`, fullPage: true });
  log(`month start ${JSON.stringify(await head())} today:${await page.evaluate(() => document.querySelector('.mcell[data-today]')?.dataset.day)}`);
  const multi = await page.evaluate(() => ['2026-09-25', '2026-09-26', '2026-09-27'].map((d) => [...document.querySelectorAll(`.mcell[data-day="${d}"] .mev__title`)].some((t) => /Fan Zone/.test(t.textContent))));
  log(`month multi-day Fan Zone on Sep 25,26,27: ${JSON.stringify(multi)} pass:${multi.every(Boolean)}`);
  await page.locator('.month-view__nav .iconbtn').nth(1).click();
  await page.waitForTimeout(300);
  const next = await head();
  await page.screenshot({ path: `${OUT}/month-next-1440.png` });
  await page.locator('.month-view__nav .iconbtn').nth(0).click();
  await page.locator('.month-view__nav .iconbtn').nth(0).click();
  await page.waitForTimeout(300);
  const prev = await head();
  await page.locator('.month-view__today').click();
  await page.waitForTimeout(300);
  log(`month next ${JSON.stringify(next)} prev-twice ${JSON.stringify(prev)} today ${JSON.stringify(await head())}`);
  await page.locator('.mcell[data-day="2026-09-25"] .mcell__num').click();
  await page.waitForTimeout(300);
  const day = await page.evaluate(() => ({ title: document.querySelector('.dayview__title')?.textContent, rows: [...document.querySelectorAll('.dayview .arow__title')].map((t) => t.textContent) }));
  await page.screenshot({ path: `${OUT}/month-day-selected-1440.png` });
  log(`month select Sep 25 ${JSON.stringify(day)}`);
  await page.locator('.mcell[data-day="2026-09-29"] .mev').first().click();
  await page.waitForURL((u) => u.pathname.startsWith('/news/'), { timeout: 15000 }).catch(() => {});
  log(`month event opens page url:${path(page)} pass:${path(page).startsWith('/news/')}`);
  await page.goBack();
  await page.waitForTimeout(800);
  await page.locator('.fbtn', { hasText: 'City' }).click();
  await page.waitForTimeout(250);
  await page.locator('.fpanel:popover-open .fopt', { hasText: 'Bentonville' }).first().click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const f = await page.evaluate(() => ({ count: document.querySelector('.month-view__count')?.textContent, url: decodeURIComponent(location.search), sub: document.querySelector('.subscribe__city summary')?.textContent }));
  await page.screenshot({ path: `${OUT}/month-filtered-bentonville-1440.png` });
  log(`month filter Bentonville ${JSON.stringify(f)} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
  await page.goto(BASE + '/calendar/?month=2026-10', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  log(`month shared ?month=2026-10 -> ${JSON.stringify(await head())}`);
  for (const w of [1025, 1680, 1920]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(BASE + '/calendar/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/month-${w}.png`, fullPage: true });
    log(`month ${w} overflowX:${await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)} dayPanelBeside:${await page.evaluate(() => { const g = document.querySelector('.mgrid').getBoundingClientRect(); const d = document.querySelector('.dayview').getBoundingClientRect(); return d.left > g.right - 1; })}`);
  }
  await ctx.close();
}

async function phonecal() {
  const ctx = await ctxFor(390);
  const page = await ctx.newPage();
  const errors = watch(page);
  await page.goto(BASE + '/calendar/', { waitUntil: 'networkidle' });
  await page.locator('.mgrid').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/phone-calendar-390.png`, fullPage: true });
  await page.locator('.mcell[data-day="2026-09-25"] .mcell__num').click();
  await page.waitForTimeout(300);
  const day = await page.evaluate(() => ({ title: document.querySelector('.dayview__title')?.textContent, rows: document.querySelectorAll('.dayview .arow').length, dots: document.querySelectorAll('.mcell[data-day="2026-09-25"] .mcell__dots i').length, listHidden: getComputedStyle(document.querySelector('.mcell__events')).display }));
  await page.locator('.dayview').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/phone-calendar-day-390.png` });
  log(`phonecal tap Sep 25 ${JSON.stringify(day)}`);
  const title = () => page.evaluate(() => document.querySelector('.month-view__title')?.textContent);
  const box = await page.locator('.mgrid').boundingBox();
  const swipeX = async (dx) => page.evaluate(async ({ x, y, dx }) => {
    const g = document.querySelector('.mgrid');
    const fire = (type, cx) => g.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 9, pointerType: 'touch', clientX: cx, clientY: y, isPrimary: true }));
    fire('pointerdown', x);
    await new Promise((r) => setTimeout(r, 30));
    fire('pointerup', x + dx);
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2, dx });
  const t0 = await title();
  await swipeX(-140);
  await page.waitForTimeout(300);
  const t1 = await title();
  await swipeX(140);
  await page.waitForTimeout(300);
  const t2 = await title();
  log(`phonecal swipe ${t0} -> left ${t1} -> right ${t2} pass:${t1 !== t0 && t2 === t0} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
  await ctx.close();
}

async function subscribe() {
  const ctx = await ctxFor(1440);
  const page = await ctx.newPage();
  await page.goto(BASE + '/calendar/', { waitUntil: 'networkidle' });
  const links = await page.evaluate(() => [...document.querySelectorAll('#subscribe .subscribe__list:first-of-type a')].map((a) => [a.textContent, a.getAttribute('href')]));
  await page.locator('#subscribe').screenshot({ path: `${OUT}/subscribe-block-1440.png` });
  log(`subscribe links ${JSON.stringify(links)}`);
  const ok = links.length === 3
    && links[0][1] === 'webcal://nwanext.com/calendar.ics'
    && links[1][1] === 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent('webcal://nwanext.com/calendar.ics')
    && links[2][1] === 'https://outlook.live.com/calendar/0/addfromweb?url=' + encodeURIComponent('https://nwanext.com/calendar.ics') + '&name=NWA%20Next';
  log(`subscribe urls-correct:${ok}`);
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#subscribe .subscribe__opt', { hasText: 'Copy link' }).first().click();
  await page.waitForTimeout(300);
  log(`subscribe copy status:"${await page.evaluate(() => document.querySelector('#subscribe .subscribe__status')?.textContent)}" clipboard:${await page.evaluate(() => navigator.clipboard.readText().catch(() => 'n/a'))}`);
  for (const url of ['/calendar.ics', '/calendar/bentonville/calendar.ics']) {
    const res = await page.request.get(BASE + url);
    const body = await res.text();
    const unfolded = body.replace(/\r\n /g, '');
    const events = unfolded.split('BEGIN:VEVENT').slice(1).map((e) => e.split('END:VEVENT')[0]);
    const timed = events.find((e) => /DTSTART;TZID=America\/Chicago:\d{8}T\d{6}/.test(e));
    const allday = events.find((e) => /DTSTART;VALUE=DATE:\d{8}/.test(e));
    const head = ['X-WR-CALNAME', 'X-WR-TIMEZONE:America/Chicago', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H', 'BEGIN:VTIMEZONE'].map((k) => unfolded.includes(k));
    const crlf = body.split('\n').every((l, i, a) => i === a.length - 1 || l.endsWith('\r'));
    const longest = Math.max(...body.split('\r\n').map((l) => new TextEncoder().encode(l).length));
    log(`ics ${url} status:${res.status()} type:${res.headers()['content-type']} VEVENTs:${events.length} headers:${JSON.stringify(head)} crlf:${crlf} longestLine:${longest}`);
    if (timed) log(`ics ${url} timed: ${timed.match(/SUMMARY:[^\r\n]*/)?.[0].slice(0, 60)} | ${timed.match(/DTSTART[^\r\n]*/)?.[0]} | ${timed.match(/DTEND[^\r\n]*/)?.[0]}`);
    if (allday) log(`ics ${url} all-day: ${allday.match(/SUMMARY:[^\r\n]*/)?.[0].slice(0, 60)} | ${allday.match(/DTSTART[^\r\n]*/)?.[0]} | ${allday.match(/DTEND[^\r\n]*/)?.[0]}`);
  }
  await ctx.close();
}

async function widths() {
  for (const w of [1025, 1280, 1440, 1680, 1920]) {
    const ctx = await ctxFor(w);
    for (const [name, p] of [['home', '/'], ['news', '/news/'], ['events', '/events/'], ['story', EVENT], ['city', '/cities/fayetteville/'], ['guides', '/guides/']]) {
      const page = await ctx.newPage();
      const errors = watch(page);
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      await settle(page);
      await page.waitForTimeout(500);
      const info = await page.evaluate(() => {
        const m = document.querySelector('main').getBoundingClientRect();
        const cols = getComputedStyle(document.querySelector('.feed[data-view="grid"] .feed__list') || document.body).gridTemplateColumns.split(' ').length;
        return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, mainLeft: Math.round(m.left), mainRight: Math.round(innerWidth - m.right), mainWidth: Math.round(m.width), cols };
      });
      const nested = await nestedScroll(page);
      await page.screenshot({ path: `${OUT}/width-${name}-${w}.png`, fullPage: true });
      log(`width ${name} ${w} ${JSON.stringify(info)} nestedScroll:${nested.length ? JSON.stringify(nested) : 'none'} errors:${errors.length ? JSON.stringify(errors.slice(0, 2)) : 'none'}`);
      await page.close();
    }
    await ctx.close();
  }
}

async function tabs() {
  const ctx = await ctxFor(390);
  const page = await ctx.newPage();
  const errors = watch(page);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/tabbar-home-390.png` });
  await page.locator('.tabbar .tab', { hasText: 'Calendar' }).click();
  await page.waitForURL('**/calendar/');
  await page.waitForTimeout(300);
  log(`tabs Calendar -> ${path(page)} current:${await page.locator('.tabbar [aria-current="page"]').textContent()}`);
  await page.locator('.tabbar .tab', { hasText: 'New spots' }).click();
  await page.waitForURL('**/openings/');
  log(`tabs New spots -> ${path(page)} current:${await page.locator('.tabbar [aria-current="page"]').textContent()}`);
  await page.locator('.tabbar .tab', { hasText: 'More' }).click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/more-sheet-390.png` });
  log(`tabs More open:${await isOpen(page, 'dialog.more')} scroll-lock:${await page.evaluate(() => getComputedStyle(document.documentElement).overflow)}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  log(`tabs More after Esc open:${await isOpen(page, 'dialog.more')}`);
  await page.locator('.tabbar .tab', { hasText: 'More' }).click();
  await page.waitForTimeout(300);
  await page.locator('dialog.more .more__bar .iconbtn').click();
  await page.waitForTimeout(400);
  log(`tabs More after Close open:${await isOpen(page, 'dialog.more')}`);
  await page.locator('.tabbar .tab', { hasText: 'More' }).click();
  await page.waitForTimeout(300);
  await page.locator('dialog.more .more__link', { hasText: 'Fayetteville' }).click();
  await page.waitForURL('**/cities/fayetteville/');
  await page.waitForTimeout(300);
  log(`tabs More city -> ${path(page)} open:${await isOpen(page, 'dialog.more')}`);
  // City picker in the top bar.
  await page.locator('.topbar__scope').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/town-picker-topbar-390.png` });
  await page.locator('#town-pick .towns__item', { hasText: 'Bentonville' }).click();
  await page.waitForTimeout(400);
  log(`tabs top-bar picker -> ${await page.locator('.topbar__scope').textContent()} saved:${await page.evaluate(() => localStorage.getItem('nwa-city'))} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
  await page.evaluate(() => localStorage.removeItem('nwa-city'));
  await ctx.close();
}

async function days() {
  for (const w of [1440, 390]) {
    const ctx = await ctxFor(w);
    const page = await ctx.newPage();
    const errors = watch(page);
    await page.goto(BASE + '/events/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('nwa-city'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const sel = () => page.evaluate(() => document.querySelector('.day[aria-pressed="true"]')?.dataset.key);
    log(`days ${w} start selected:${await sel()} enabled:${await page.locator('.day:not(:disabled)').count()} of ${await page.locator('.day').count()}`);
    await page.screenshot({ path: `${OUT}/days-start-${w}.png` });
    const target = await page.locator('.day:not(:disabled)').nth(2).getAttribute('data-key');
    await page.locator(`.day[data-key="${target}"]`).click();
    await page.waitForTimeout(1200);
    const top = await page.evaluate((k) => Math.round(document.getElementById(`day-${k}`).getBoundingClientRect().top), target);
    await page.screenshot({ path: `${OUT}/days-pressed-${w}.png` });
    log(`days ${w} press ${target} selected:${await sel()} headingTop:${top} pass:${(await sel()) === target && top < 200}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const last = await page.evaluate(() => [...document.querySelectorAll('.day:not(:disabled)')].at(-1)?.dataset.key);
    await page.evaluate((k) => { const el = document.getElementById(`day-${k}`); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60); }, last);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/days-scrolled-${w}.png` });
    log(`days ${w} scroll-to ${last} selected:${await sel()} pass:${(await sel()) === last}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    if (w < 700) { await page.locator('.fbar__sheetbtn').click(); await page.waitForTimeout(300); await page.locator('dialog.fsheet section:has(#fs-free) .fopt').click(); await page.locator('dialog.fsheet section:has(#fs-when) .fopt', { hasText: 'This weekend' }).click(); await page.locator('.fsheet__go').click(); }
    else { await page.locator('.ftoggle').click(); await page.locator('.fbtn', { hasText: 'When' }).click(); await page.waitForTimeout(250); await page.locator('.fpanel:popover-open .fopt', { hasText: 'This weekend' }).click(); await page.keyboard.press('Escape'); }
    await page.waitForTimeout(500);
    const both = await page.evaluate(() => ({ url: decodeURIComponent(location.search), count: document.querySelector('.fbar__count')?.textContent, days: [...document.querySelectorAll('.agenda__head span:first-child')].map((h) => h.textContent) }));
    await page.screenshot({ path: `${OUT}/days-filters-${w}.png`, fullPage: true });
    log(`days ${w} weekend+free ${JSON.stringify(both)}`);
    await page.goto(BASE + '/events/?when=weekend&free=1', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    log(`days ${w} shared-url chips:${JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.fbar__active .fchip span:first-child')].map((t) => t.textContent)))} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
    await ctx.close();
  }
}

async function search() {
  for (const w of [1440, 390]) {
    const ctx = await ctxFor(w);
    const page = await ctx.newPage();
    const errors = watch(page);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    if (w === 1440) await page.keyboard.press('/');
    else await page.locator('.tabbar .tab', { hasText: 'Search' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/search-open-${w}.png` });
    log(`search ${w} open:${await isOpen(page, 'dialog.search')} focus:${await page.evaluate(() => document.activeElement?.className)}`);
    await page.keyboard.type('momentary');
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ count: document.querySelector('.search__count')?.textContent, groups: [...document.querySelectorAll('dialog.search .sgroup__title')].map((g) => g.textContent), first: document.querySelector('dialog.search .sresult__title')?.textContent }));
    await page.screenshot({ path: `${OUT}/search-momentary-${w}.png` });
    log(`search ${w} momentary ${JSON.stringify(r)}`);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    const active = await page.evaluate(() => document.querySelector('dialog.search [aria-selected="true"] a')?.getAttribute('href'));
    await page.screenshot({ path: `${OUT}/search-arrow-${w}.png` });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    await page.waitForURL((u) => u.pathname === active, { timeout: 15000 }).catch(() => {});
    log(`search ${w} arrow+enter active:${active} searchOpen:${await isOpen(page, 'dialog.search')} url:${path(page)} pass:${!(await isOpen(page, 'dialog.search')) && path(page) === active}`);
    await page.goBack();
    await page.waitForTimeout(800);
    if (w === 1440) await page.keyboard.press('/');
    else await page.locator('.tabbar .tab', { hasText: 'Search' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/search-recent-${w}.png` });
    await page.keyboard.type('this weekend');
    await page.waitForTimeout(500);
    const wk = await page.evaluate(() => ({ count: document.querySelector('.search__count')?.textContent, titles: [...document.querySelectorAll('dialog.search .sresult__title')].map((t) => t.textContent.slice(0, 40)) }));
    await page.screenshot({ path: `${OUT}/search-weekend-${w}.png` });
    log(`search ${w} this-weekend ${JSON.stringify(wk)}`);
    await page.locator('dialog.search .search__input').fill('xyzzy');
    await page.waitForTimeout(400);
    const none = await page.evaluate(() => document.querySelector('dialog.search .search__none p')?.textContent);
    await page.screenshot({ path: `${OUT}/search-none-${w}.png` });
    log(`search ${w} no-results "${none}"`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    log(`search ${w} esc open:${await isOpen(page, 'dialog.search')} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
    await ctx.close();
  }
}

async function calendar() {
  for (const w of [1440, 390]) {
    const ctx = await ctxFor(w);
    const page = await ctx.newPage();
    await page.goto(BASE + EVENT, { waitUntil: 'networkidle' });
    await page.locator('.facts__actions button', { hasText: 'Add to calendar' }).click();
    await page.waitForTimeout(300);
    const menu = await page.evaluate(() => [...document.querySelectorAll('.menu-pop:popover-open a')].map((a) => [a.textContent, a.getAttribute('href').slice(0, 60)]));
    await page.screenshot({ path: `${OUT}/calendar-menu-${w}.png` });
    log(`calendar ${w} story menu ${JSON.stringify(menu)}`);
    const ics = await page.request.get(BASE + EVENT + 'event.ics');
    const body = await ics.text();
    log(`calendar ${w} ics status:${ics.status()} type:${ics.headers()['content-type']} start:${body.match(/DTSTART;[^\r\n]*/)?.[0]}`);
    await page.keyboard.press('Escape');
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('.feed .post__actions button', { hasText: 'Add to calendar' }).first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/calendar-menu-feed-${w}.png` });
    log(`calendar ${w} feed menu open:${await page.evaluate(() => !!document.querySelector('.menu-pop:popover-open'))}`);
    await ctx.close();
  }
}

async function keys() {
  for (const [name, p, n] of [['home', '/', 40], ['story', EVENT, 34]]) {
    const ctx = await ctxFor(1440);
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const seen = [];
    for (let i = 0; i < n; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        // Whole-card links draw their ring on the card (the link's own ring is transparent).
        const host = el.closest('.row, .arow, .mini, .srow, .pair, .city-row, .place-row, .post, .spot, .nextstory__card');
        const target = el.matches('.row__link, .pair__link, .post__link, .spot__link, .nextstory__link') && host ? host : el;
        const cs = getComputedStyle(target);
        const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 && cs.outlineColor !== 'rgba(0, 0, 0, 0)';
        const r = el.getBoundingClientRect();
        return { label: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32), ring, visible: r.width > 0 && r.height > 0 };
      });
      if (info) seen.push(info);
      if ([2, 8, 16, 24].includes(i)) await page.screenshot({ path: `${OUT}/focus-${name}-${i + 1}-1440.png` });
    }
    log(`keys ${name} order: ${seen.map((s) => `${s.label}${s.ring ? '' : ' [NO RING]'}${s.visible ? '' : ' [HIDDEN]'}`).join(' | ')}`);
    log(`keys ${name} all-rings:${seen.every((s) => s.ring)} all-visible:${seen.every((s) => s.visible)}`);
    await ctx.close();
  }
}

// Hover: no card, row or panel may move or resize when the pointer is over it. Compares the card's
// own box and the layout box of everything inside it (offset boxes ignore the photo's intended zoom,
// which is a transform), plus the box of the card after it, before and after a hover.
async function hover() {
  const TARGETS = [
    ['/', '.feed .post--lead'], ['/', '.feed .post:not(.post--lead)'], ['/', '.ecard__link'], ['/', '.spot'],
    ['/', '.sidenav__link:not([aria-current])'], ['/', '.button--quiet'], ['/', '.sitemap__col a'],
    ['/events/', '.arow'], [EVENT, '.related .row'], [EVENT, '.nextstory__card'],
    ['/cities/', '.ccard'], ['/places/', '.ccard'], ['/guides/', '.ccard--panel'], ['/guides/', '.pair'],
    ['/newsletter/', '.ccard--story'], ['/connect/', '.way .button'], ['/this-page-is-not-here/', '.way--link'],
  ];
  const ctx = await ctxFor(1440);
  const page = await ctx.newPage();
  let cur = '';
  for (const [p, sel] of TARGETS) {
    if (p !== cur) { await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(700); cur = p; }
    const el = page.locator(sel).first();
    if (!(await el.count())) { log(`hover ${p} ${sel} found:false pass:false`); continue; }
    await el.scrollIntoViewIfNeeded();
    await page.mouse.move(2, 2);
    await page.waitForTimeout(700);
    const boxes = () => el.evaluate((root) => {
      const r = root.getBoundingClientRect();
      const next = root.nextElementSibling?.getBoundingClientRect();
      const inner = [...root.querySelectorAll('*')].filter((n) => n instanceof HTMLElement).map((n) => [n.offsetLeft, n.offsetTop, n.offsetWidth, n.offsetHeight].join(','));
      return { self: [r.x, r.y, r.width, r.height].map((v) => v.toFixed(2)).join(','), next: next ? [next.x, next.y, next.width, next.height].map((v) => v.toFixed(2)).join(',') : '', inner: inner.join('|') };
    });
    const before = await boxes();
    const b = await el.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + Math.min(b.height / 2, 40));
    await page.waitForTimeout(900);
    const after = await boxes();
    const same = before.self === after.self && before.next === after.next && before.inner === after.inner;
    log(`hover ${p} ${sel} self:${before.self === after.self} inner:${before.inner === after.inner} next:${before.next === after.next} pass:${same}`);
  }
  await page.mouse.move(2, 2);
  await ctx.close();
}

async function reduce() {
  for (const w of [1440, 390]) {
    const ctx = await ctxFor(w, { reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = watch(page);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/reduced-motion-home-${w}.png` });
    // Hover and filter transitions still fade; nothing moves.
    const moved = await page.evaluate(() => getComputedStyle(document.querySelector('.feed .post img')).scale);
    log(`reduce ${w} img-scale:${moved} pass:${moved === '1' || moved === 'none'} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
    await ctx.close();
  }
}

async function weight() {
  const ctx = await ctxFor(390);
  const page = await ctx.newPage();
  const sizes = new Map();
  page.on('response', async (r) => {
    if (r.request().resourceType() !== 'image') return;
    try { sizes.set(r.url(), (await r.body()).length); } catch {}
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  await page.waitForTimeout(1500);
  const total = [...sizes.values()].reduce((a, b) => a + b, 0);
  log(`weight home 390 images:${sizes.size} total:${(total / 1024).toFixed(0)} KB (${(total / 1048576).toFixed(2)} MB) under-1MB:${total < 1048576}`);
  await ctx.close();
}

async function jsonld() {
  const ctx = await ctxFor(1440);
  const page = await ctx.newPage();
  for (const [name, p] of [['event-story', EVENT], ['opening-story', OPENING], ['events', '/events/'], ['calendar', '/calendar/']]) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const blocks = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent));
    const parsed = blocks.map((b) => JSON.parse(b));
    const types = parsed.flatMap((d) => (d['@graph'] ? d['@graph'].map((g) => g['@type']) : [d['@type']]));
    const ev = parsed.find((d) => d['@type'] === 'Event');
    const evOk = ev ? !!(ev.name && ev.startDate && ev.location?.name && ev.location?.address) : null;
    const list = parsed.find((d) => d['@type'] === 'ItemList');
    log(`jsonld ${name} blocks:${blocks.length} parsed:ok types:${types.join(',')}${ev ? ` event:{name:${!!ev.name},startDate:${ev.startDate},location:${ev.location?.name}} required-ok:${evOk}` : ''}${list ? ` itemList:${list.itemListElement.length}` : ''}`);
  }
  await ctx.close();
}

async function links() {
  const ctx = await ctxFor(390);
  const page = await ctx.newPage();
  const errors = watch(page);
  await page.goto(BASE + '/links/', { waitUntil: 'networkidle' });
  const info = await page.evaluate(() => ({ tabbar: !!document.querySelector('.tabbar'), side: !!document.querySelector('.side'), rows: document.querySelectorAll('.links__btn').length, robots: document.querySelector('meta[name="robots"]')?.content }));
  await page.screenshot({ path: `${OUT}/links-390-view.png` });
  log(`links 390 ${JSON.stringify(info)} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
  await ctx.close();
}

// Real date (no NWA_NOW): run against a server built without it, e.g. out/ served on another port.
async function empty() {
  for (const w of [1440, 390]) {
    const ctx = await ctxFor(w);
    for (const [name, p] of [['home', '/'], ['events', '/events/']]) {
      const page = await ctx.newPage();
      const errors = watch(page);
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      await settle(page);
      await page.waitForTimeout(800);
      const text = await page.evaluate(() => [...document.querySelectorAll('.empty-line, .agenda-empty__line, .panel-block__empty')].map((e) => e.textContent.trim()));
      await page.screenshot({ path: `${OUT}/empty-real-date-${name}-${w}.png`, fullPage: true });
      log(`empty ${name} ${w} ${JSON.stringify(text)} errors:${errors.length ? JSON.stringify(errors) : 'none'}`);
      await page.close();
    }
    await ctx.close();
  }
}

const all = { pages, sheet, scope, filters, tabs, days, month, phonecal, subscribe, search, calendar, keys, hover, reduce, weight, jsonld, links, widths };
if (mode === 'empty') await empty();
else for (const [name, fn] of Object.entries(all)) if (mode === 'all' || mode === name) await fn();
await browser.close();
// Summary: a line fails when a check says pass:false, the page scrolls sideways, an element scrolls
// up and down inside the page, there are console errors, or text is under 15px.
const bad = results.filter((l) => /pass:false|overflowX:[1-9]|"overflow":[1-9]|nestedScroll:\[|errors:\[|small:/.test(l) || (/^page /.test(l) && !/crumbs:true/.test(l)));
const summary = `summary ${mode}: ${results.length} lines, ${results.filter((l) => /pass:true/.test(l)).length} explicit passes, ${bad.length} failing`;
console.log(summary);
for (const l of bad) console.log(`FAIL ${l}`);
fs.writeFileSync(`${OUT}/qa-results-${mode}.txt`, results.join('\n') + '\n' + summary + '\n' + bad.map((l) => `FAIL ${l}`).join('\n') + (bad.length ? '\n' : ''));
