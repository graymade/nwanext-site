// NWA Next, nwanext.com. Hand-written behaviour for every page; each block runs only when its markup is on the page.
// Page data comes from JSON islands written at build time (lib/render): #ev (events and today), #towns, #months.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)'), FINE = matchMedia('(hover: hover) and (pointer: fine)');
  const J = (id) => { const el = document.getElementById(id); try { return el ? JSON.parse(el.textContent) : null; } catch { return null; } };
  const EVD = J('ev') || {}, EV = EVD.ev || [], NOW = EVD.now || new Date().toISOString().slice(0, 10), root = document.documentElement;
  const X = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const PAUSE = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
  const PLAY = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';
  // Buttons carry their label twice for the slide hover; always change both copies.
  const setLabel = (b, t) => { const l = b.querySelector('.lb'); if (!l) return; l.dataset.t = t; l.firstElementChild.textContent = t; };
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const day = (s) => new Date(s + 'T12:00:00');

  // ---------- section reveals, with a watchdog so nothing stays hidden
  const showAll = () => $$('.rv').forEach((el) => el.classList.add('in'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach((el) => io.observe(el));
    setTimeout(() => $$('.rv:not(.in)').forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }), 2500);
  } else showAll();

  // ---------- dialogs (menu, tip) and the forms (they post to the Google Apps Script set in the CMS, like the old site)
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) { const d = document.getElementById(o.dataset.open); if (d) { o.closest('dialog')?.close(); if (d.id === 'tip') tipKind(d, o.dataset.kind || 'other'); d.showModal(); } }
    const c = e.target.closest('[data-close]'); if (c) c.closest('dialog')?.close();
    if (e.target.closest('.sheet a')) e.target.closest('dialog').close();
  });
  const TIPPH = { opening: 'The name, what it is and where it is', event: 'What it is, where and when', change: 'What’s changing, and where', other: 'A new spot, an event, something changing on your street' };
  function tipKind(d, k) { if (!d) return; const r = d.querySelector(`input[name=kind][value="${k}"]`); if (r) r.checked = true; const t = d.querySelector('textarea'); if (t) t.placeholder = TIPPH[k] || TIPPH.other; }
  document.addEventListener('change', (e) => { if (e.target.name === 'kind') tipKind(e.target.closest('form'), e.target.value); });
  $$('.dlg').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
  // no-cors: Apps Script answers through a redirect the browser can't read, so a finished request counts as sent.
  // The hidden "website" field is a bot trap; the script drops anything that fills it. The tip's kind goes at the front of the tip text.
  const KIND = { opening: 'New spot', event: 'Event', change: 'Something changing', other: 'Other' };
  $$('form[data-form]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!f.reportValidity()) return;
    const g = (n) => (f.elements[n] && f.elements[n].value || '').trim();
    const ok = f.querySelector('.ok') || f.parentElement.querySelector('.ok'), err = f.querySelector('.err'), btn = f.querySelector('[type=submit]');
    let body;
    if (f.dataset.form === 'newsletter') body = { type: 'newsletter', email: g('email'), website: g('website') };
    else { const k = (f.querySelector('input[name=kind]:checked') || {}).value || 'other';
      body = { type: 'tip', tip: `[${KIND[k] || 'Other'}] ${g('what')}${g('where') ? `\nWhere: ${g('where')}` : ''}${g('when') ? `\nWhen: ${g('when')}` : ''}`, source: g('link'), email: g('email'), website: g('website') }; }
    if (btn) btn.disabled = true;
    try {
      await fetch(f.action, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ ...body, page: location.pathname }) });
      if (ok) ok.hidden = false; if (err) err.hidden = true; f.reset(); tipKind(f, 'other');
      if (window.gtag) gtag('event', body.type === 'tip' ? 'tip_sent' : 'sign_up');
      const d = f.closest('dialog'); if (d) setTimeout(() => { d.close(); if (ok) ok.hidden = true; }, 1800);
    } catch { if (err) err.hidden = false; }
    if (btn) btn.disabled = false;
  }));

  // ---------- popovers: place pickers and calendar menus under their buttons (pickers become a bottom sheet on phones)
  const SHEET = matchMedia('(max-width:640px)');
  $$('[popover]').forEach((p) => {
    const b = $(`[popovertarget="${p.id}"]`); if (!b) return;
    p.addEventListener('beforetoggle', (e) => {
      if (e.newState !== 'open') return;
      p.dispatchEvent(new CustomEvent('opening'));
      if (p.classList.contains('pm') && SHEET.matches) { p.style.left = p.style.top = ''; return; }
      const r = b.getBoundingClientRect(), w = p.classList.contains('pm') ? Math.min(352, innerWidth - 32) : 224;
      p.style.left = Math.min(Math.max(16, r.left), innerWidth - w - 16) + scrollX + 'px';
      p.style.top = r.bottom + scrollY + 10 + 'px';
    });
    p.addEventListener('toggle', (e) => {
      const open = e.newState === 'open'; b.setAttribute('aria-expanded', open);
      if (open && p.classList.contains('pm')) (p.querySelector('[aria-selected="true"]') || p.querySelector('[role=option]')).focus();
    });
  });

  // ---------- sentence pickers. Counts come from the page (window.countFor), so a choice with nothing says so first.
  $$('.pm').forEach((p) => {
    const b = $(`[popovertarget="${p.id}"]`), opts = $$('[role=option]', p), key = b.dataset.key;
    p.addEventListener('opening', () => { if (!window.countFor) return; opts.forEach((o) => { const n = window.countFor(key, o.dataset.value); o.querySelector('.n').textContent = n ? `${n} ${window.countWord || 'coming up'}` : 'Nothing yet'; o.classList.toggle('zero', !n); }); });
    p.addEventListener('keydown', (e) => { const i = opts.indexOf(document.activeElement), k = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: opts.length - 1 }[e.key]; if (k === undefined) return; e.preventDefault(); opts[(k + opts.length) % opts.length].focus(); });
    opts.forEach((o) => o.addEventListener('click', () => {
      opts.forEach((x) => x.setAttribute('aria-selected', x === o)); b.dataset.value = o.dataset.value; b.querySelector('.v').textContent = o.dataset.t;
      p.hidePopover(); b.focus(); document.dispatchEvent(new CustomEvent('pick', { detail: { key, value: o.dataset.value } }));
    }));
  });

  // ---------- My plans (saved on this device)
  const K = 'nwa-plans'; let P = [];
  try { P = JSON.parse(localStorage.getItem(K) || '[]'); } catch { P = []; }
  const byId = (id) => EV.find((e) => e.id === id);
  const syncPlans = (bump) => {
    localStorage.setItem(K, JSON.stringify(P));
    $$('.save').forEach((b) => { const on = P.includes(b.dataset.id); b.setAttribute('aria-pressed', on); setLabel(b, on ? 'Saved' : 'Save'); });
    $$('.plans b,.pc').forEach((b) => { b.textContent = P.length; if (bump) { b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 260); } });
    const ul = $('.plansp ul'); if (!ul) return;
    const items = P.map(byId).filter(Boolean);
    ul.innerHTML = items.map((e) => `<li>${e.t}<span>${e.d}</span><button type="button" data-rm="${e.id}" aria-label="Remove ${e.t}">${X}</button></li>`).join('');
    $('.plansp .pe').hidden = !!items.length; $('.plansp .allcal').hidden = !items.length;
  };
  document.addEventListener('click', (e) => {
    const s = e.target.closest('.save'); if (s) { e.preventDefault(); const id = s.dataset.id; P = P.includes(id) ? P.filter((x) => x !== id) : [...P, id]; syncPlans(true); }
    const rm = e.target.closest('[data-rm]'); if (rm) { P = P.filter((x) => x !== rm.dataset.rm); syncPlans(true); }
    if (e.target.closest('.allcal')) {
      const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NWA Next//Plans//EN'];
      P.map(byId).filter(Boolean).forEach((v) => { const tz = v.s.includes('T') ? ';TZID=America/Chicago' : ';VALUE=DATE'; L.push('BEGIN:VEVENT', 'UID:' + v.id + '@nwanext.com', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART' + tz + ':' + v.s, 'DTEND' + tz + ':' + v.e, 'SUMMARY:' + v.t, 'LOCATION:' + v.l.replace(/,/g, '\\,'), 'URL:' + v.u, 'END:VEVENT'); });
      L.push('END:VCALENDAR');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([L.join('\r\n')], { type: 'text/calendar' })); a.download = 'nwa-next-plans.ics'; a.click();
    }
  });
  syncPlans();

  // ---------- what's on: sentence filter, week arrows, day strip, agenda
  const strip = $('.strip');
  if (strip) {
    const st = { town: 'all', what: 'all', week: 0, days: new Set() };
    const rows = $$('.agenda .ev'), empty = $('.agenda .empty'), jump = $('[data-jump]'), clear = $('.wknav .clear'), wkl = $('.wkl');
    const [prev, next] = $$('[data-wk]'), d0 = day(NOW), mon = new Date(d0); mon.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
    const at = (w, i) => { const d = new Date(mon); d.setDate(mon.getDate() + w * 7 + i); return d; };
    const last = EV.reduce((m, e) => (e.date > m ? e.date : m), NOW);
    const weeks = Math.floor((day(last) - mon) / 864e5 / 7) + 1;
    const okTown = (c) => st.town === 'all' || c === st.town, okWhat = (c) => st.what === 'all' || c.split(' ').includes(st.what);
    const inWeek = (date, w) => date >= ymd(at(w, 0)) && date <= ymd(at(w, 6));
    const inScope = (date) => (st.days.size ? st.days.has(date) : inWeek(date, st.week));
    const match = (e) => okTown(e.city) && okWhat(e.c);
    window.countFor = (key, v) => EV.filter((e) => (key === 'town' ? v === 'all' || e.city === v : okTown(e.city)) && (key === 'what' ? v === 'all' || e.c.split(' ').includes(v) : okWhat(e.c))).length;
    const md = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const label = (w) => { const a = at(w, 0), b = at(w, 6); return `${md(a)}–${a.getMonth() === b.getMonth() ? b.getDate() : md(b)}`; };
    const render = (dir = 0) => {
      strip.innerHTML = Array.from({ length: 7 }, (_, i) => {
        const d = at(st.week, i), iso = ymd(d), n = EV.filter((e) => e.date === iso && match(e)).length, past = iso < NOW;
        const nm = iso === NOW ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
        return `<button type="button" data-day="${iso}" aria-pressed="${st.days.has(iso)}" class="${n ? 'has' : ''} ${i > 3 ? 'we' : ''}" ${past ? 'disabled' : ''} aria-label="${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${n ? `${n} ${n === 1 ? 'event' : 'events'}` : 'nothing posted yet'}"><small>${nm}</small><b>${d.getDate()}</b>${n ? `<i class="ct" aria-hidden="true">${n}</i>` : ''}</button>`;
      }).join('');
      strip.classList.remove('fwd', 'back'); if (dir) { void strip.offsetWidth; strip.classList.add(dir > 0 ? 'fwd' : 'back'); }
      wkl.innerHTML = `<small>${st.week === 0 ? 'This week' : st.week === 1 ? 'Next week' : `In ${st.week} weeks`}</small> <b>${label(st.week)}</b>`;
      prev.disabled = st.week === 0; next.disabled = st.week >= weeks - 1;
      filter();
    };
    const nextWith = () => { for (let w = st.week + 1; w < weeks; w++) if (EV.some((e) => match(e) && inWeek(e.date, w))) return w; return -1; };
    const filter = () => {
      let n = 0;
      rows.forEach((el) => { const ok = okTown(el.dataset.city) && okWhat(el.dataset.c) && inScope(el.dataset.date); el.hidden = !ok; n += ok; });
      $$('.agenda .day').forEach((s) => (s.hidden = !$$('.ev', s).some((e) => !e.hidden)));
      empty.hidden = !!n; jump.hidden = nextWith() < 0; clear.hidden = !st.days.size;
      $$('[aria-pressed]', strip).forEach((b) => b.setAttribute('aria-pressed', st.days.has(b.dataset.day)));
    };
    strip.addEventListener('click', (e) => { const b = e.target.closest('[data-day]'); if (!b) return; const iso = b.dataset.day; const only = st.days.size === 1 && st.days.has(iso); st.days = new Set(only ? [] : [iso]); filter(); });
    [prev, next].forEach((b) => b.addEventListener('click', () => { st.week = Math.min(weeks - 1, Math.max(0, st.week + +b.dataset.wk)); st.days.clear(); render(+b.dataset.wk); }));
    clear.addEventListener('click', () => { st.days.clear(); filter(); });
    jump.addEventListener('click', () => { const w = nextWith(); if (w < 0) return; const dir = w - st.week; st.week = w; st.days.clear(); render(dir); });
    document.addEventListener('pick', (e) => { st[e.detail.key] = e.detail.value; render(); });
    // events.html?from=YYYY-MM-DD&to=YYYY-MM-DD (the weekend cards link here)
    const q = new URLSearchParams(location.search), from = q.get('from'), to = q.get('to');
    if (from) { for (let w = 0; w < weeks; w++) if (inWeek(from, w)) st.week = w; for (let d = day(from); ymd(d) <= (to || from); d.setDate(d.getDate() + 1)) st.days.add(ymd(d)); }
    render();
  }

  // ---------- list pages (new spots, news): filter cards by town
  const filt = $('.filt');
  if (filt && !strip) {
    const items = $$('[data-city]', filt); window.countWord = 'posted';
    window.countFor = (k, v) => items.filter((x) => v === 'all' || x.dataset.city === v).length;
    document.addEventListener('pick', (e) => { let n = 0; items.forEach((x) => { const ok = e.detail.value === 'all' || x.dataset.city === e.detail.value; x.hidden = !ok; n += ok; }); $('.empty', filt).hidden = !!n; });
  }

  // ---------- hero carousel: featured stories rotate and keep rotating under the pointer; pause button, pause while keyboard focus is inside, swipe on phones, no autoplay under reduced motion
  const hero = $('.hero');
  if (hero) {
    const slides = $$('.slide', hero), tabs = $$('.tab', hero), pause = $('.pause', hero); let i = 0, held = false;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { const on = k === i; s.classList.toggle('on', on); s.toggleAttribute('inert', !on); s.setAttribute('aria-hidden', !on); });
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); const bar = $('.bar i', t); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; });
    };
    const setPaused = (p) => { hero.classList.toggle('paused', p); pause.setAttribute('aria-pressed', p); pause.setAttribute('aria-label', p ? 'Play the slideshow' : 'Pause the slideshow'); pause.innerHTML = p ? PLAY : PAUSE; };
    tabs.forEach((t, k) => { t.addEventListener('click', () => go(k)); $('.bar i', t).addEventListener('animationend', () => { if (k === i) go(i + 1); }); });
    $('.tabs', hero).addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return; go(i + d); tabs[i].focus(); });
    pause.addEventListener('click', () => { held = !hero.classList.contains('paused'); setPaused(held); });
    // only keyboard focus pauses; a mouse click on a tab also focuses it, and that shouldn't stop the timer
    hero.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) hero.classList.add('paused'); });
    hero.addEventListener('focusout', (e) => { if (!held && !hero.contains(e.relatedTarget)) hero.classList.remove('paused'); });
    let sx = null; hero.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); sx = null; });
    if (RM.matches) { hero.classList.add('still'); held = true; setPaused(true); }
  }

  // ---------- weekends: native scroll carousel with arrows
  $$('.wkends').forEach((sec) => {
    const car = $('.car', sec), [pv, nx] = $$('[data-car]', sec);
    const step = (d) => car.scrollBy({ left: d * (car.firstElementChild.getBoundingClientRect().width + 16) });
    const sync = () => { const max = car.scrollWidth - car.clientWidth; pv.disabled = car.scrollLeft <= 1; nx.disabled = car.scrollLeft >= max - 1; };
    pv.addEventListener('click', () => step(-1)); nx.addEventListener('click', () => step(1));
    car.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
  });

  // ---------- creek stone shapes in JS (same geometry as logo.mjs) for the living badge, the town hover and the stone buttons
  const f1 = (v) => Math.round(v * 10) / 10;
  const smooth = (pts) => { const n = pts.length, p = (i) => pts[(i + n) % n]; let d = `M${p(0).map(f1)}`; for (let i = 0; i < n; i++) { const [a, b, c, e] = [p(i - 1), p(i), p(i + 1), p(i + 2)]; d += ` C${[b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6].map(f1)} ${[c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6].map(f1)} ${c.map(f1)}`; } return d + 'Z'; };
  // Stones are smooth functions of the angle, sampled densely, so no frame of any motion can grow a corner. f: the stone's hand-set
  // radius factors, eased round the outline. w(a): a live wobble built from low harmonics only (no point-by-point jitter).
  const per = (f, u) => { const n = f.length, x = u * n, i = Math.floor(x), t = x - i, p = (k) => f[(((i + k) % n) + n) % n], a = p(-1), b = p(0), c = p(1), d = p(2);
    return b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a))); };
  const STEPS = 48;
  const blob = (cx, cy, rx, ry, ex, f, rot = 0, w = null) => Array.from({ length: STEPS }, (_, i) => { const u = i / STEPS, th = u * 2 * Math.PI + rot, c = Math.cos(th), s = Math.sin(th),
    r = (Math.abs(c) ** ex / rx ** ex + Math.abs(s) ** ex / ry ** ex) ** (-1 / ex) * per(f, u) * (w ? w(u * 2 * Math.PI) : 1); return [cx + r * c, cy + r * s]; });
  const F0 = [1.0, 0.97, 0.96, 1.0, 1.03, 1.02, 0.99, 0.97, 1.0, 1.04, 1.03, 1.0];
  const wobble = (t, amp, seed = 0) => (a) => 1 + amp * (0.026 * Math.sin(2 * a + t * 1.7 + seed) + 0.014 * Math.sin(3 * a - t * 2.3 + 1 + seed) + 0.006 * Math.sin(4 * a + t * 2.9 + 2 + seed));

  // the newsletter badge: breathes gently, ripples when you hover it
  const bs = $('.badge.live .bs');
  if (bs && !RM.matches) {
    const badgeEl = bs.closest('svg'); let amp = 0.3, target = 0.3, vis = false, raf = 0;
    const draw = (now) => { const t = now / 1000; amp += (target - amp) * 0.06; bs.setAttribute('d', smooth(blob(865, 628, 1325, 968, 2.7, F0, -0.06 + amp * 0.025 * Math.sin(t * 0.9), wobble(t, amp)).map(([x, y]) => [x, 14 - y]))); raf = vis ? requestAnimationFrame(draw) : 0; };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(draw); }).observe(badgeEl);
    badgeEl.addEventListener('pointerenter', () => (target = 1.6)); badgeEl.addEventListener('pointerleave', () => (target = 0.3));
    badgeEl.addEventListener('pointerdown', () => { amp = 2.8; badgeEl.animate([{ scale: '1 1' }, { scale: '1.13 .86', offset: 0.22 }, { scale: '.92 1.1', offset: 0.48 }, { scale: '1.04 .97', offset: 0.7 }, { scale: '1 1' }], { duration: 700, easing: 'ease-out' }); });
    new IntersectionObserver(([e], ob) => { if (!e.isIntersecting) return; ob.disconnect(); amp = 2.4;
      badgeEl.classList.add('grown');
      badgeEl.animate([{ scale: 0, rotate: '-38deg' }, { scale: 1.14, rotate: '14deg', offset: 0.5 }, { scale: 0.95, rotate: '5deg', offset: 0.72 }, { scale: 1.02, rotate: '9deg', offset: 0.88 }, { scale: 1, rotate: '8deg' }], { duration: 1150, easing: 'cubic-bezier(.3,.7,.4,1)' });
      $('.bl', badgeEl).animate([{ scale: 0, opacity: 0 }, { scale: 0, opacity: 0, offset: 0.25 }, { scale: 1.07, opacity: 1, offset: 0.65 }, { scale: 1 }], { duration: 1100, easing: 'ease-out' });
    }, { threshold: 0.2 }).observe(badgeEl.parentElement); // watch the header row, never the scaled-to-zero badge itself
    setTimeout(() => badgeEl.classList.add('grown'), 6000); // watchdog: never leave the logo invisible
  }
  $$('.badge.live').forEach((b) => { if (RM.matches || !('IntersectionObserver' in window)) b.classList.add('grown'); });

  // the town list: one clay stone follows whichever town you point at or tab to
  $$('.townlist').forEach((list) => {
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
    svg.setAttribute('class', 'tstone'); svg.setAttribute('viewBox', '0 0 200 90'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    svg.append(path); list.prepend(svg); path.setAttribute('d', smooth(blob(100, 45, 95.5, 43, 2.7, F0, -0.06)));
    let hot = null, raf = 0;
    const loop = (now) => { path.setAttribute('d', smooth(blob(100, 45, 95.5, 43, 2.7, F0, -0.06 + 0.05 * Math.sin(now / 700), wobble(now / 1000, 1.3)))); raf = hot ? requestAnimationFrame(loop) : 0; };
    const to = (a) => {
      if (hot) hot.classList.remove('hot'); hot = a;
      if (!a) { svg.classList.remove('on'); return; }
      const fs = parseFloat(getComputedStyle(list).fontSize), px = fs * 0.32, py = fs * 0.1;
      if (!svg.classList.contains('on')) svg.style.transition = 'opacity .2s'; else svg.style.transition = '';
      svg.style.translate = `${a.offsetLeft - px}px ${a.offsetTop - py}px`; svg.style.inlineSize = `${a.offsetWidth + px * 2}px`; svg.style.blockSize = `${a.offsetHeight + py * 2}px`;
      a.classList.add('hot'); svg.classList.add('on'); if (!raf && !RM.matches) raf = requestAnimationFrame(loop);
    };
    list.addEventListener('pointerover', (e) => { const a = e.target.closest('a'); if (a && a !== hot && FINE.matches) to(a); });
    list.addEventListener('pointerleave', () => to(null));
    list.addEventListener('focusin', (e) => to(e.target.closest('a')));
    list.addEventListener('focusout', (e) => { if (!list.contains(e.relatedTarget)) to(null); });
  });

  // tip stones: each one wobbles into a moving creek stone while you point at it
  $$('.tst').forEach((b) => {
    const path = $('.sh path', b), f = b.dataset.f.split(',').map(Number), r = +b.dataset.r; let k = 0, on = false, raf = 0;
    const tick = (now) => { k += ((on ? 1 : 0) - k) * 0.1; const t = now / 1000; path.setAttribute('d', smooth(blob(150, 85, 146 + 4 * k, 82 + 4 * k, 2.6, f, r + k * 0.06 * Math.sin(t * 1.3), wobble(t * 1.3, k * 1.4, r * 9))));
      raf = on || k > 0.003 ? requestAnimationFrame(tick) : 0; };
    b.addEventListener('pointerenter', () => { if (!FINE.matches || RM.matches) return; on = true; if (!raf) raf = requestAnimationFrame(tick); });
    b.addEventListener('pointerleave', () => { on = false; });
  });

  // ---------- towns page. A close, flat map of Benton and Washington counties. Labels and markers are sized in screen pixels (so
  // they read the same on a phone and a wide screen) and placed so none collide; a town with no room shows its name on hover. A clay
  // stone follows the town you point at, tab to or tap, and the card beside the map tells you about it. On touch, the first tap picks.
  const tsvg = $('.tsvg');
  if (tsvg) {
    const V = JSON.parse(tsvg.dataset.views), card = $('.tcard'), def = card.innerHTML;
    const towns = $$('.mc', tsvg), fol = $('.mfollow', tsvg), stl = $$('.st', tsvg), T = Object.fromEntries((J('towns') || []).map((t) => [t.n, t]));
    const KXW = Math.cos((36 * Math.PI) / 180), wp = (lo, la) => [(lo + 95) * KXW * 1000, (37 - la) * 1000];
    const tier = (a) => +[...a.classList].find((c) => /^t\d$/.test(c)).slice(1);
    const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    let vb = V.nwa.slice(), hot = null, raf = 0, cur = null, tgt = null;
    const setVB = (r) => { vb = r; tsvg.setAttribute('viewBox', r.map((v) => v.toFixed(2)).join(' ')); };
    const k = () => Math.min(tsvg.clientWidth / vb[2], tsvg.clientHeight / vb[3]);
    const small = () => tsvg.clientWidth < 560;
    const visible = () => { const s = k(), w = tsvg.clientWidth / s, h = tsvg.clientHeight / s; return [vb[0] - (w - vb[2]) / 2, vb[1] - (h - vb[3]) / 2, w, h]; };
    const sizeStates = () => { const s = k(); stl.forEach((t) => {
      const [lo, la] = t.dataset.at.split(',').map(Number), [x, y] = wp(lo, la), px = t.classList.contains('lk') ? 14 : 13;
      t.setAttribute('font-size', (px / s).toFixed(2)); t.setAttribute('x', x); t.setAttribute('y', y);
      t.setAttribute('text-anchor', t.classList.contains('lk') ? 'start' : 'middle');
      if (t.dataset.rot) t.setAttribute('transform', `rotate(${t.dataset.rot} ${x} ${y})`); });
      tsvg.style.setProperty('--b', (2.5 / s).toFixed(2) + 'px'); };
    const layout = () => {
      const s = k(), sm = small(), vis = visible(), m = 10 / s, boxes = [];
      const FS = sm ? { 1: 17, 2: 13.5, 3: 12.5 } : { 1: 23, 2: 16, 3: 14 }, RAD = { 1: 9, 2: 6.5, 3: 5 };
      towns.forEach((a) => { const r = (RAD[tier(a)] * (sm ? 0.85 : 1)) / s, x = +a.dataset.x, y = +a.dataset.y; a._r = r;
        $('.mk', a).setAttribute('transform', `translate(${x} ${y}) scale(${(r / 100).toFixed(5)})`); boxes.push([x - r, y - r, x + r, y + r]); });
      stl.forEach((t) => { const b = t.getBBox(); if (t.dataset.rot) { const x = +t.getAttribute('x'), y = +t.getAttribute('y'); boxes.push([x - b.height, y - b.width / 2, x + b.height * 0.3, y + b.width / 2]); } else boxes.push([b.x, b.y, b.x + b.width, b.y + b.height]); });
      const out = (b) => b[0] < vis[0] + m || b[2] > vis[0] + vis[2] - m || b[1] < vis[1] + m || b[3] > vis[1] + vis[3] - m;
      const over = (b) => boxes.reduce((n, o) => n + Math.max(0, Math.min(b[2], o[2]) - Math.max(b[0], o[0])) * Math.max(0, Math.min(b[3], o[3]) - Math.max(b[1], o[1])), 0);
      [...towns].sort((a, b) => tier(a) - tier(b)).forEach((a, i) => {
        const t = $('text', a), tr = tier(a), fs = FS[tr] / s, x = +a.dataset.x, y = +a.dataset.y, g = a._r + fs * 0.35;
        t.setAttribute('font-size', fs.toFixed(2)); const w = t.getComputedTextLength();
        const opts = [[x + g, y + fs * 0.34, 'start'], [x - g, y + fs * 0.34, 'end'], [x, y - g - fs * 0.15, 'middle'], [x, y + g + fs * 0.8, 'middle'], [x + g * 0.8, y - g * 0.6, 'start'], [x - g * 0.8, y - g * 0.6, 'end'], [x + g * 0.8, y + g + fs * 0.55, 'start'], [x - g * 0.8, y + g + fs * 0.55, 'end']];
        const bx = ([tx, ty, an]) => { const x0 = an === 'start' ? tx : an === 'end' ? tx - w : tx - w / 2; return [x0 - 4 / s, ty - fs * 0.8, x0 + w + 4 / s, ty + fs * 0.25]; };
        let pick = opts.find((o) => { const b = bx(o); return !out(b) && !over(b); });
        if (!pick && tr === 1) pick = [...opts].sort((p, q) => over(bx(p)) + (out(bx(p)) ? 1e9 : 0) - over(bx(q)) - (out(bx(q)) ? 1e9 : 0))[0];
        a.classList.toggle('nolbl', !pick); const o = pick || opts[0];
        t.setAttribute('x', o[0].toFixed(1)); t.setAttribute('y', o[1].toFixed(1)); t.setAttribute('text-anchor', o[2]); if (pick) boxes.push(bx(pick));
        t.style.animationDelay = `${(-(x % 9) * 0.6).toFixed(2)}s`; a.style.setProperty('--d', `${(0.15 + i * 0.045).toFixed(2)}s`);
      });
    };
    // the stone behind the town you're on
    const tb = (el) => { const r = el.getBoundingClientRect(), mt = tsvg.getScreenCTM().inverse(), a = new DOMPoint(r.left, r.top).matrixTransform(mt), b = new DOMPoint(r.right, r.bottom).matrixTransform(mt); return [(a.x + b.x) / 2, (a.y + b.y) / 2, (b.x - a.x) / 2, (b.y - a.y) / 2]; };
    const loop = (now) => {
      if (hot) { const s = k(); tgt = tb($('text', hot)).map((v, i) => (i === 2 ? v + 15 / s : i === 3 ? v + 8 / s : v)); }
      if (tgt) { cur = cur ? cur.map((v, i) => v + (tgt[i] - v) * (RM.matches ? 1 : 0.22)) : tgt.slice();
        const t = RM.matches ? 0 : now / 1000; fol.setAttribute('d', smooth(blob(cur[0], cur[1], cur[2], cur[3], 2.6, F0, -0.05 + 0.04 * Math.sin(t * 1.4), wobble(t, 1.2)))); }
      raf = hot ? requestAnimationFrame(loop) : 0;
    };
    const show = (name) => { const t = T[name]; card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
      if (!t) { card.innerHTML = def; return; }
      card.innerHTML = `<div class="tci">${t.ph ? `<img src="${e(t.ph.src)}" alt="${e(t.ph.alt)}">` : ''}<p class="tck">${e(t.co)}</p><h2>${e(t.n)}</h2><p class="tcp">${e(t.i)}</p>
<ul class="tcn"><li><b>${t.ev}</b> ${t.ev === 1 ? 'event' : 'events'}</li><li><b>${t.sp}</b> new ${t.sp === 1 ? 'spot' : 'spots'}</li><li><b>${t.nw}</b> news</li></ul>
<a class="btn clay" href="${e(t.u)}"><span class="lb" data-t="See ${e(t.n)}"><span>See ${e(t.n)}</span></span></a></div>`; };
    const to = (a, kb = false) => {
      if (hot === a) return; if (hot) hot.classList.remove('hot'); hot = a;
      fol.classList.toggle('on', !!a); fol.classList.toggle('kb', kb && !!a);
      if (!a) { cur = tgt = null; return; } a.classList.add('hot'); show(a.dataset.town); if (!raf) raf = requestAnimationFrame(loop);
    };
    tsvg.addEventListener('pointerover', (ev) => { const a = ev.target.closest('.mc'); if (a && FINE.matches) to(a); });
    tsvg.addEventListener('pointerleave', () => { if (FINE.matches) to(null); });
    tsvg.addEventListener('focusin', (ev) => { const a = ev.target.closest('.mc'); if (a) to(a, true); });
    tsvg.addEventListener('click', (ev) => { const a = ev.target.closest('.mc'); if (a && !FINE.matches && a !== hot) { ev.preventDefault(); to(a); } });
    const fit = () => { setVB(small() ? V.core : V.nwa); sizeStates(); layout(); };
    new ResizeObserver(fit).observe(tsvg); fit();
    // towns pop in one after another the first time the map is seen
    new IntersectionObserver(([en], ob) => { if (!en.isIntersecting) return; ob.disconnect(); tsvg.classList.add('in'); }, { threshold: 0.25 }).observe(tsvg);
  }

  // stone buttons (the default): every button rests as a creek stone (site.css), and on hover the stone starts to move
  const live = new Map(); let hovered = null, braf = 0;
  const btick = (now) => {
    const t = now / 1000;
    live.forEach((k, b) => {
      k += ((b === hovered ? 1 : 0) - k) * 0.14; live.set(b, k);
      if (k < 0.005 && b !== hovered) { live.delete(b); ['--br', '--bs', '--brot'].forEach((v) => b.style.removeProperty(v)); return; }
      const tt = RM.matches ? 0 : t;
      // the resting stone (same numbers as site.css), each corner drifting by up to a few percent while you point at it
      const H = [26, 34, 24, 32].map((p, i) => (p + k * 6 * Math.sin(tt * 2.1 + i * 1.7)).toFixed(2) + '%');
      const V = [56, 44, 54, 44].map((p, i) => (p + k * 5 * Math.sin(tt * 1.8 + i * 2.3)).toFixed(2) + '%');
      b.style.setProperty('--br', `${H.join(' ')} / ${V.join(' ')}`);
      if (!RM.matches) { b.style.setProperty('--bs', `${(1 + 0.05 * k).toFixed(3)} ${(1 + 0.12 * k).toFixed(3)}`); b.style.setProperty('--brot', `${(k * 2.2 * Math.sin(t * 1.4)).toFixed(2)}deg`); }
    });
    braf = live.size ? requestAnimationFrame(btick) : 0;
  };
  document.addEventListener('pointerover', (e) => {
    if (root.dataset.btn !== 'stone' || !FINE.matches) return;
    const b = e.target.closest('.btn:not(:disabled)'); if (b === hovered) return;
    hovered = b; if (b && !live.has(b)) live.set(b, 0); if (live.size && !braf) braf = requestAnimationFrame(btick);
  });

  // ---------- footer wordmark: lands once, the first time it comes into view (the motion is site.css @keyframes land)
  const big = $('.big');
  if (big) {
    const land = () => { if (big.classList.contains('in')) return; big.classList.add('in'); removeEventListener('scroll', check); };
    const check = () => { if (big.getBoundingClientRect().top < innerHeight - 40) land(); }; // backup, so the space is never left empty
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { land(); io.disconnect(); } }, { threshold: 0.05 }); io.observe(big); } else land();
    addEventListener('scroll', check, { passive: true }); check();
  }
  // ---------- calendar: one month at a time, arrows step through the months that have events (and this one)
  const cal = $('.cal');
  if (cal) {
    const months = J('months') || [], secs = $$('.cmonth', cal), lab = $('.cml', cal), [cp, cn] = $$('[data-cm]', cal);
    let ci = Math.max(0, secs.findIndex((s) => !s.hidden));
    const showM = (i) => { ci = Math.min(secs.length - 1, Math.max(0, i)); secs.forEach((s, k) => (s.hidden = k !== ci)); lab.textContent = (months[ci] || [])[1] || ''; cp.disabled = ci === 0; cn.disabled = ci === secs.length - 1; };
    cp.addEventListener('click', () => showM(ci - 1)); cn.addEventListener('click', () => showM(ci + 1)); showM(ci);
  }

  // ---------- search: loads the index once (/search-index.json) and matches every word, as you type
  const sform = $('.sform');
  if (sform) {
    const inp = $('input', sform), res = $('.sres'), stat = $('.sstat'), hint = $('.shint'); let IDX = null;
    const KN = { story: 'Story', place: 'Place', city: 'Town', topic: 'Topic', guide: 'Guide' };
    const norm = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const e = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const run = async () => {
      const q = norm(inp.value.trim()); hint.hidden = !!q;
      if (!q) { res.innerHTML = ''; stat.textContent = ''; return; }
      if (!IDX) { try { IDX = await (await fetch('/search-index.json')).json(); } catch { IDX = []; } }
      const ws = q.split(/\s+/);
      const hits = IDX.map((x) => { const t = norm(x.t), hay = `${t} ${norm(x.s)} ${norm(x.m)}`; if (!ws.every((w) => hay.includes(w))) return null; return { x, sc: ws.reduce((n, w) => n + (t.includes(w) ? 3 : 1), 0) + (x.k === 'story' ? 0 : 1) }; })
        .filter(Boolean).sort((a, b) => b.sc - a.sc || String(b.x.d || '').localeCompare(String(a.x.d || ''))).slice(0, 40);
      stat.textContent = hits.length ? `${hits.length} ${hits.length === 1 ? 'result' : 'results'}` : 'Nothing matches that yet. Try a town or a simpler word.';
      res.innerHTML = hits.map(({ x }) => { const pic = x.img ? x.img.replace(/\.[^.]+$/, '-240.webp') : ''; return `<li><a href="${e(x.u)}">${pic ? `<img src="${e(pic)}" alt="" loading="lazy">` : `<span class="sk">${KN[x.k] || ''}</span>`}<span><b>${e(x.t)}</b><span>${e(KN[x.k])}${x.m ? ` · ${e(String(x.m).split(' · ').slice(0, 2).join(' · '))}` : ''}</span></span></a></li>`; }).join('');
    };
    const q0 = new URLSearchParams(location.search).get('q'); if (q0) inp.value = q0;
    let tmr; inp.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => { run(); history.replaceState(null, '', inp.value ? `?q=${encodeURIComponent(inp.value)}` : location.pathname); }, 120); });
    sform.addEventListener('submit', (ev) => { ev.preventDefault(); run(); });
    run(); if (!q0) inp.focus();
  }
})();
