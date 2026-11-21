// The page shell as HTML: header, menu sheet, newsletter band, tip stones, footer and the tip form dialog.
import { getSite } from '../content';
import { B, I, INK, CLAY, CLAY_HI, PAPER, badge, bigMark, blob, esc, lb, mark, smooth, split, wd } from './kit';

// Sam, 2026-11-21: tips by the site form or by email (CMS: Site settings). Anything that isn't a plain address falls back, so CMS text can't add markup.
const RAW_EMAIL = String((getSite() as { email?: string }).email || '').trim();
export const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(RAW_EMAIL) ? RAW_EMAIL : 'hello@nwanext.com';
export const TAG = ['New eats, events & openings across Northwest Arkansas.', 'If it’s worth leaving the house for, it’s here.'];
// How NWA Next sources its stories, in Sam's words (2026-11-21). Used on About, Credits, Privacy and the tip form.
export const SOURCING = 'We pull information and photos from published sources and from the businesses and organizations we write about, and we always credit where they came from.';

const NAV: [string, string][] = [['/events/', 'What’s on'], ['/openings/', 'New spots'], ['/news/', 'News'], ['/cities/', 'Towns']];
const MORE: [string, string][] = [['/calendar/', 'Calendar'], ['/guides/', 'Guides'], ['/places/', 'Places'], ['/connect/', 'Get connected'], ['/about/', 'About']];

export const header = (cur: string, over = false) => `<a class="skip" href="#main">Skip to content</a>
<header class="top ${over ? 'over' : ''}"><a class="logo" href="/" aria-label="nwa next, home">${over ? mark('horizontal', PAPER, PAPER, 'lt', CLAY_HI) + mark('horizontal-small', PAPER, PAPER, 'ls', CLAY_HI) : mark('horizontal', INK, CLAY, 'lt', true) + mark('horizontal-small', INK, CLAY, 'ls', true)}</a>
<nav class="nav" aria-label="Main">${NAV.map(([h, t]) => `<a href="${h}" ${h === cur ? 'aria-current="page"' : ''}>${lb(t)}</a>`).join('')}</nav>
<a class="srch" href="/search/" aria-label="Search">${I.search}</a>
<a class="plans" href="/events/#plans">${I.heart}<span>My plans</span><b>0</b></a>${B('Newsletter', { cls: `${over ? 'paper' : 'ink'} sm cta`, href: '#letter' })}
<button type="button" class="menu-btn" aria-haspopup="dialog" data-open="menu">${lb('Menu')}</button></header>
<dialog class="sheet menu" id="menu" aria-label="Menu"><div class="sheet-top">${mark('horizontal-small', PAPER, CLAY_HI, 'ls')}<button type="button" class="x" data-close aria-label="Close menu">${I.x}</button></div>
<nav aria-label="Main">${[['/', 'Home'] as [string, string], ...NAV].map(([h, t]) => `<a href="${h}" ${h === cur ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
<nav class="sheet-more" aria-label="More">${[['/search/', 'Search'] as [string, string], ...MORE].map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</nav>
<div class="sheet-acts">${B('My plans', { cls: 'paper', href: '/events/#plans', icon: I.heart })}${B('Newsletter', { cls: 'clay', href: '#letter' })}${B('Send a tip', { cls: 'line on-dark', attrs: 'data-open="tip"' })}</div></dialog>`;

// The newsletter form posts to the Google Apps Script in the CMS (Site settings), like the old site.
export const newsletterForm = (id = 'em', cls = 'paper') => `<form class="form" data-form="newsletter" action="${esc(getSite().newsletter.action)}"><label class="vh" for="${id}">Email</label><input id="${id}" name="email" type="email" required placeholder="you@email.com" autocomplete="email"><input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">${B('Subscribe', { cls, type: 'submit' })}</form>`;

export const letter = () => `<section class="letter rv" id="letter"><div class="wrap">
<div class="lhead"><h2 class="split">${wd(['Find', 'out', 'what’s', 'next<span class="pd">.</span>'], 3)}</h2>${badge('live')}</div>
<div class="lrow"><p>New openings, things to do and what’s changing across Northwest Arkansas, straight to your inbox.</p>
${newsletterForm()}
<p class="ok" role="status" hidden>You’re on the list. Look out for the first one.</p></div></div></section>`;

// Tips: three creek stones, one per kind of tip. Each opens the tip form with that kind already picked.
const TIPK: [string, string, number[], number][] = [['opening', 'A new spot', [1.0, 0.95, 0.97, 1.03, 1.05, 1.0, 0.98, 0.95, 1.0, 1.04, 1.02, 0.99], -0.05],
  ['event', 'An event', [1.03, 1.0, 0.96, 0.98, 1.02, 1.05, 1.0, 0.97, 0.95, 1.0, 1.04, 1.02], 0.08],
  ['change', 'Something changing', [0.98, 1.02, 1.04, 1.0, 0.97, 0.96, 1.01, 1.04, 1.03, 0.98, 0.96, 1.0], -0.1]];
export const tipStones = () => `<div class="tipstones">${TIPK.map(([k, t, f, r], i) => `<button type="button" class="tst t${i}" data-open="tip" data-kind="${k}" data-f="${f.join(',')}" data-r="${r}"><svg class="sh" viewBox="0 0 300 170" preserveAspectRatio="none" aria-hidden="true"><path d="${smooth(blob(150, 85, 146, 82, 2.6, f, r))}"/></svg><span><small>Tell us about</small>${t}</span>${I.tar}</button>`).join('')}</div>`;
export const tips = () => `<section class="tips wrap rv" aria-labelledby="tipsh"><div class="tiphead"><h2 id="tipsh" class="split">${split('Spotted something new?')}</h2>
<p>Send it our way with the form, or email us at <a href="mailto:${EMAIL}">${EMAIL}</a>. A lot of our best stories start with a reader.</p></div>
${tipStones()}</section>`;

export const tipForm = (dialog = true) => `<form class="tipform" data-form="tip" action="${esc(getSite().tips.action)}">
${dialog ? `<div class="dlg-top"><h2 id="tiph">Send us a tip</h2><button type="button" class="x" data-close aria-label="Close">${I.x}</button></div>` : ''}
<fieldset class="kinds"><legend>What is it?</legend>${[['opening', 'A new spot'], ['event', 'An event'], ['change', 'Something changing'], ['other', 'Something else']].map(([v, t], i) => `<label><input type="radio" name="kind" value="${v}" ${i === 3 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</fieldset>
<label>What’s happening?<textarea name="what" required placeholder="A new spot, an event, something changing on your street"></textarea></label>
<div class="two"><label>Where<input name="where" placeholder="Town or address"></label><label>When<input name="when" placeholder="Date or time, if there is one"></label></div>
<label>Link <span>Optional: a website, post or listing</span><input name="link" type="url" placeholder="https://"></label>
<label>Your email <span>Optional, so we can follow up</span><input name="email" type="email" autocomplete="email"></label>
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<div class="acts">${B('Send tip', { cls: 'clay', type: 'submit', icon: I.arrow })}${dialog ? B('Cancel', { cls: 'line', attrs: 'data-close' }) : ''}</div>
<p class="alt">Rather email? <a href="mailto:${EMAIL}">${EMAIL}</a></p>
<p class="ok" role="status" hidden>Thanks. We’ll look into it.</p><p class="err" role="alert" hidden>That didn’t send. Try again, or email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p></form>`;

const tipDialog = () => `<dialog class="dlg" id="tip" aria-labelledby="tiph">${tipForm(true)}</dialog>`;

export const footer = () => { const s = getSite(); return `<footer class="foot"><div class="wrap">
<div class="ftag rv"><p class="ft1">${esc(TAG[0])}</p><p class="ft2 split">${split(TAG[1])}</p></div>
<div class="flinks"><a href="/about/">About</a><a href="/guides/">Guides</a><a href="/calendar/">Calendar</a><a href="/connect/">Get connected</a><button type="button" data-open="tip">Send a tip</button><a href="mailto:${EMAIL}">${EMAIL}</a><a href="${esc(s.instagram)}">Instagram</a><a href="webcal://nwanext.com/calendar.ics">Calendar feed</a><a href="/feed.xml">RSS</a></div>
<a class="big" href="/" aria-label="nwa next, home">${bigMark()}</a>
<div class="fine"><span>© ${new Date().getFullYear()} NWA Next</span><span><a href="/privacy/">Privacy</a><a href="/credits/">Credits</a></span></div></div>
</footer>
${tipDialog()}`; };

// One page: header, the page body, then the newsletter band, tip stones and footer.
export const shell = ({ cur = '', over = false, body, letterBand = true, tipsBand = true }: { cur?: string; over?: boolean; body: string; letterBand?: boolean; tipsBand?: boolean }) =>
  `${header(cur, over)}<main id="main">${body}</main>${letterBand ? letter() : ''}${tipsBand ? tips() : ''}${footer()}`;
