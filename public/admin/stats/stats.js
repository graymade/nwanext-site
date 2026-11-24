// nwanext.com/admin/stats/: GA4 and Search Console for the editors.
// Uses the GitHub token the CMS login stores in this browser; the stats Worker checks it.
(() => {
  const qs = new URLSearchParams(location.search);
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const API = qs.get('api') || (local ? 'http://localhost:8799' : 'https://nwanext-stats.graymade.workers.dev');
  const DEMO = qs.has('demo');
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // Only link to pages on this site; Analytics paths can be spammed.
  const href = (u) => { const v = String(u || ''); return /^\/(?!\/)/.test(v) || /^https:\/\/(www\.)?nwanext\.com\//.test(v) ? esc(v) : '#'; };
  const fmt = (n) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : Math.round(n).toLocaleString('en-US'));
  const pct = (n) => `${(n * 100).toFixed(n < 0.1 ? 1 : 0)}%`;
  const mins = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`);
  let days = Number(localStorage.getItem('nwa-stats-days')) || 28;

  function token() {
    try { return JSON.parse(localStorage.getItem('sveltia-cms.user') || 'null')?.token || null; } catch { return null; }
  }

  function status(html, cls = '') {
    const el = $('status');
    el.className = `note ${cls}`;
    el.innerHTML = html;
    el.hidden = false;
  }

  async function load(fresh = false) {
    document.querySelectorAll('.range button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.days) === days)));
    if (DEMO) return render(demoData(days), true);
    const t = token();
    if (!t) return status('<p><b>Sign in to the editor first.</b> Stats use the same GitHub login.</p><p><a class="btn" href="/admin/">Sign in</a> then come back to this page.</p>');
    status('Loading…');
    let res, data;
    try {
      res = await fetch(`${API}/stats?days=${days}${fresh ? '&fresh=1' : ''}`, { headers: { authorization: `Bearer ${t}` } });
      data = await res.json();
    } catch {
      return status('<p><b>Couldn’t reach the stats service.</b> Check the connection and reload.</p>');
    }
    if (data.error === 'sign_in') return status('<p><b>Your editor login has expired.</b></p><p><a class="btn" href="/admin/">Sign in again</a></p>');
    if (data.error === 'no_access') return status('<p><b>This GitHub account can’t edit the site,</b> so it can’t see stats.</p>');
    if (data.error === 'google_auth') return status(`<p><b>Google isn’t connected yet.</b> The stats service needs read access to Analytics and Search Console.</p><p class="small">${esc(data.detail)}</p>`);
    if (!res.ok) return status(`<p><b>Something went wrong.</b></p><p class="small">${esc(data.error)}</p>`);
    render(data, false);
  }

  function render(d, demo) {
    if (demo) status('<p><b>Sample data.</b> These numbers are made up to check the layout. Remove <code>?demo</code> from the address to see the real ones.</p>', 'demo');
    else $('status').hidden = true;
    $('out').hidden = false;
    const ga = d.ga || {};

    // Live now
    const rt = d.realtime || {};
    $('live').innerHTML = rt.error ? '' : `<strong><i class="dot" aria-hidden="true"></i>${fmt(rt.active || 0)} ${rt.active === 1 ? 'person' : 'people'} on the site right now</strong>${(rt.pages || []).length ? `<span>Reading: ${rt.pages.slice(0, 3).map((p) => esc(cleanTitle(p.title))).join(', ')}</span>` : ''}`;

    if (ga.error) {
      $('tiles').innerHTML = `<p class="note">Analytics: ${esc(ga.error)}</p>`;
    } else {
      const c = ga.totals.cur, p = ga.totals.prev;
      const per = c.visitors ? c.engagedSeconds / c.visitors : 0;
      const perPrev = p.visitors ? p.engagedSeconds / p.visitors : 0;
      const tiles = [
        ['Visitors', fmt(c.visitors), c.visitors, p.visitors],
        ['New visitors', fmt(c.newVisitors), c.newVisitors, p.newVisitors],
        ['Page views', fmt(c.views), c.views, p.views],
        ['Time per visitor', mins(per), per, perPrev],
        ['Newsletter signups', fmt(ga.events.cur.sign_up), ga.events.cur.sign_up, ga.events.prev.sign_up],
        ['Tips sent', fmt(ga.events.cur.tip_sent), ga.events.cur.tip_sent, ga.events.prev.tip_sent],
      ];
      $('tiles').innerHTML = tiles.map(([k, v, a, b]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div>${delta(a, b)}</div>`).join('');
      const sum = ga.daily.reduce((s, r) => s + r.visitors, 0);
      $('daily-sum').textContent = ga.daily.length ? `Busiest day ${fmt(Math.max(...ga.daily.map((r) => r.visitors)))} visitors` : '';
      lineChart($('daily'), ga.daily.map((r) => ({ x: r.date, y: r.visitors, v: r.views })), sum);

      rows($('pages'), ga.pages.map((r) => ({ label: `<a href="${href(r.path)}" title="${esc(r.path)}">${esc(cleanTitle(r.title) || r.path)}</a>`, n: r.views, unit: 'views' })));
      rows($('channels'), ga.channels.map((r) => ({ label: esc(r.name), n: r.sessions, unit: 'visits' })));
      rows($('sources'), ga.sources.map((r) => ({ label: esc(r.source), n: r.sessions, unit: 'visits', hi: /instagram/i.test(r.source) })));
      rows($('cities'), ga.cities.map((r) => ({ label: esc(r.city === '(not set)' ? 'Unknown' : `${r.city}${r.region && r.region !== 'Arkansas' ? `, ${r.region}` : ''}`), n: r.visitors, unit: 'visitors', hi: r.region === 'Arkansas' })));
      rows($('devices'), ga.devices.map((r) => ({ label: esc(r.name[0].toUpperCase() + r.name.slice(1)), n: r.visitors, unit: 'visitors' })));
      rows($('ai'), ga.ai.map((r) => ({ label: esc(r.source), n: r.sessions, unit: 'visits' })), 'None yet. These show up once answer engines start citing nwanext.com.');
      const hmax = Math.max(1, ...ga.hours.map((h) => h.visitors));
      const byHour = Object.fromEntries(ga.hours.map((h) => [h.hour, h.visitors]));
      $('hours').innerHTML = Array.from({ length: 24 }, (_, h) => `<i style="block-size:${((byHour[h] || 0) / hmax) * 100}%" data-tip="${hourName(h)}: ${fmt(byHour[h] || 0)} visitors"></i>`).join('');
    }

    renderGsc(d.gsc || {}, ga.organicLanding || []);
    $('foot').innerHTML = `Analytics covers the last ${d.days} days including today. Search data runs about two days behind Google. Updated ${new Date(d.generated).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}${demo ? '' : ' (cached up to 30 minutes, <button type="button" class="btn" id="fresh">refresh now</button>)'}.`;
    $('fresh')?.addEventListener('click', () => load(true));
  }

  function renderGsc(g, organic) {
    const el = $('gsc');
    if (g.error) {
      el.innerHTML = `<div class="note"><p><b>Search Console isn’t connected yet.</b> Once nwanext.com is verified in Search Console, this shows the searches people use to find the site, how often it appears and where it ranks.</p><p class="small">${esc(g.error)}</p></div>`;
      return;
    }
    const t = g.totals;
    el.innerHTML = `
      <div class="tiles">
        <div class="tile"><div class="k">Clicks from Google</div><div class="v">${fmt(t.clicks)}</div></div>
        <div class="tile"><div class="k">Times shown in results</div><div class="v">${fmt(t.impressions)}</div></div>
        <div class="tile"><div class="k">Click rate</div><div class="v">${pct(t.ctr || 0)}</div></div>
        <div class="tile"><div class="k">Average position</div><div class="v">${t.position ? t.position.toFixed(1) : '–'}</div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>What people search</h3>${table(g.queries, 'No searches recorded yet.')}</div>
        <div class="card"><h3>Close to page one</h3><p class="small">Searches where a story already shows up at positions 4 to 20. A clearer headline, a summary that answers the question, or links from related stories can push these up.</p>${table(g.nearlyThere, 'Nothing here yet. Check back once Google has a few weeks of data.')}</div>
      </div>
      <div class="grid2">
        <div class="card"><h3>Pages Google sends people to</h3><ul class="rows" id="gpages"></ul></div>
        <div class="card"><h3>Landing pages from search</h3><p class="small">From Analytics, all search engines.</p><ul class="rows" id="organic"></ul></div>
      </div>
      <p class="small">${esc(g.from)} to ${esc(g.to)}</p>`;
    rows($('gpages'), g.pages.map((r) => ({ label: `<a href="${href(r.page)}">${esc(r.page.replace(/^https?:\/\/[^/]+/, '') || '/')}</a>`, n: r.clicks, unit: 'clicks' })));
    rows($('organic'), organic.map((r) => ({ label: `<a href="${href(r.path)}">${esc(r.path)}</a>`, n: r.sessions, unit: 'visits' })));
  }

  function table(list, empty) {
    if (!list?.length) return `<p class="small">${empty}</p>`;
    return `<div class="scroll"><table><thead><tr><th scope="col">Search</th><th scope="col">Clicks</th><th scope="col">Shown</th><th scope="col">Position</th></tr></thead><tbody>${list
      .map((r) => `<tr><td>${esc(r.query)}</td><td>${fmt(r.clicks)}</td><td>${fmt(r.impressions)}</td><td>${r.position.toFixed(1)}</td></tr>`)
      .join('')}</tbody></table></div>`;
  }

  function rows(el, list, empty = 'No data yet.') {
    if (!list.length) { el.innerHTML = `<li><span class="empty">${empty}</span></li>`; return; }
    const max = Math.max(...list.map((r) => r.n), 1);
    el.innerHTML = list.slice(0, 10).map((r) => `<li class="${r.hi ? 'hi' : ''}"><span class="lbl">${r.label}</span><span class="num" title="${fmt(r.n)} ${r.unit}">${fmt(r.n)}</span><span class="track" aria-hidden="true"><i style="inline-size:${(r.n / max) * 100}%"></i></span></li>`).join('');
  }

  function delta(a, b) {
    if (!b) return a ? '<div class="d">New this period</div>' : '<div class="d">&nbsp;</div>';
    const ch = (a - b) / b;
    if (Math.abs(ch) < 0.005) return '<div class="d">Same as the period before</div>';
    return `<div class="d ${ch > 0 ? 'up' : 'down'}">${ch > 0 ? 'Up' : 'Down'} ${pct(Math.abs(ch))} on the ${days} days before</div>`;
  }

  const cleanTitle = (t) => String(t || '').replace(/\s*\|\s*NWA Next$/, '');
  const hourName = (h) => (h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`);
  const dayName = (s) => new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Single-series line: visitors per day, with a crosshair and tooltip.
  function lineChart(el, pts, sum) {
    if (!pts.length) { el.innerHTML = '<p class="small">No visits recorded yet.</p>'; return; }
    const W = el.clientWidth || 800, H = el.clientHeight || 220, L = 34, R = 8, T = 8, B = 24;
    const max = Math.max(4, ...pts.map((p) => p.y));
    const step = niceStep(max);
    const top = Math.ceil(max / step) * step;
    const x = (i) => L + (pts.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (pts.length - 1));
    const y = (v) => T + (H - T - B) * (1 - v / top);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
    const grid = [];
    for (let v = 0; v <= top; v += step) grid.push(`<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`);
    const every = Math.ceil(pts.length / 6);
    const xl = pts.map((p, i) => (i % every === 0 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${dayName(p.x).replace(/^\w+, /, '')}</text>` : '')).join('');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitors per day, ${fmt(sum)} visits in total">
      <g class="grid axis">${grid.join('')}</g><g class="axis">${xl}</g>
      <path class="area" d="${line}L${x(pts.length - 1)},${y(0)}L${x(0)},${y(0)}Z"/>
      <path class="line" d="${line}"/>
      <line class="cross" y1="${T}" y2="${H - B}" visibility="hidden"/><circle class="pt" r="4.5" visibility="hidden"/>
      <rect x="${L}" y="0" width="${W - L - R}" height="${H}" fill="transparent"/></svg>`;
    const svg = el.querySelector('svg'), cross = svg.querySelector('.cross'), pt = svg.querySelector('.pt'), tip = $('tip');
    const move = (e) => {
      const r = svg.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(pts.length - 1, Math.round(((mx - L) / (W - L - R)) * (pts.length - 1))));
      const p = pts[i];
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('visibility', 'visible');
      pt.setAttribute('cx', x(i)); pt.setAttribute('cy', y(p.y)); pt.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.textContent = `${dayName(p.x)}: ${fmt(p.y)} visitors, ${fmt(p.v)} views`;
      const tx = r.left + (x(i) / W) * r.width;
      tip.style.left = `${Math.min(innerWidth - tip.offsetWidth - 8, Math.max(8, tx - tip.offsetWidth / 2))}px`;
      tip.style.top = `${r.top + (y(p.y) / H) * r.height - tip.offsetHeight - 12}px`;
    };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); pt.setAttribute('visibility', 'hidden'); });
  }
  const niceStep = (max) => { const raw = max / 4, mag = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw); };

  // Hour bars: tooltip on hover.
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest?.('[data-tip]'); const tip = $('tip');
    if (!t) { if (!e.target.closest?.('svg')) tip.hidden = true; return; }
    tip.textContent = t.dataset.tip; tip.hidden = false;
    const r = t.getBoundingClientRect();
    tip.style.left = `${Math.min(innerWidth - tip.offsetWidth - 8, Math.max(8, r.left + r.width / 2 - tip.offsetWidth / 2))}px`;
    tip.style.top = `${r.top - tip.offsetHeight - 8}px`;
  });

  document.querySelectorAll('.range button').forEach((b) => b.addEventListener('click', () => {
    days = Number(b.dataset.days); localStorage.setItem('nwa-stats-days', String(days)); load();
  }));
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!$('out').hidden) load(); }, 300); });

  // Made-up numbers for checking the layout (?demo).
  function demoData(n) {
    let s = 7; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const daily = Array.from({ length: n }, (_, i) => {
      const d = new Date(Date.now() - (n - 1 - i) * 864e5);
      const v = Math.round(40 + i * 1.5 + r() * 35 + (d.getDay() === 5 || d.getDay() === 6 ? 25 : 0));
      return { date: d.toISOString().slice(0, 10).replace(/-/g, ''), visitors: v, views: Math.round(v * (1.8 + r())) };
    });
    const vis = daily.reduce((a, b) => a + b.visitors, 0);
    return {
      days: n, generated: new Date().toISOString(),
      realtime: { active: 3, pages: [{ title: 'Hotel Vin Rogers hosts Santa Brunch | NWA Next', visitors: 2 }, { title: 'Events | NWA Next', visitors: 1 }] },
      ga: {
        totals: { cur: { visitors: vis, newVisitors: Math.round(vis * 0.78), sessions: Math.round(vis * 1.3), views: Math.round(vis * 2.4), engagedSeconds: vis * 71, engagementRate: 0.58 }, prev: { visitors: Math.round(vis * 0.8), newVisitors: Math.round(vis * 0.7), sessions: vis, views: Math.round(vis * 2), engagedSeconds: vis * 60, engagementRate: 0.55 } },
        events: { cur: { sign_up: 14, tip_sent: 3 }, prev: { sign_up: 9, tip_sent: 0 } },
        daily,
        pages: [['/', 'NWA Next | New eats, events & openings'], ['/events/', 'Events | NWA Next'], ['/news/hotel-vin-rogers-hosts-santa-brunch-at-bacchus-on-dec-6-13-and-20/', 'Hotel Vin Rogers hosts Santa Brunch at Bacchus on Dec. 6, 13 and 20 | NWA Next'], ['/openings/', 'New spots | NWA Next'], ['/cities/bentonville/', 'Bentonville | NWA Next'], ['/calendar/', 'Calendar | NWA Next']].map(([path, title], i) => ({ path, title, views: Math.round(vis / (i + 1.4)), visitors: Math.round(vis / (i + 2)) })),
        channels: [['Social', 0.46], ['Direct', 0.27], ['Organic Search', 0.18], ['Referral', 0.07], ['Unassigned', 0.02]].map(([name, f]) => ({ name, sessions: Math.round(vis * 1.3 * f) })),
        sources: [['l.instagram.com', 0.4], ['(direct)', 0.27], ['google', 0.16], ['instagram.com', 0.06], ['bing', 0.02], ['chatgpt.com', 0.01]].map(([source, f]) => ({ source, sessions: Math.round(vis * 1.3 * f) })),
        ai: [{ source: 'chatgpt.com', sessions: 9 }, { source: 'perplexity.ai', sessions: 3 }],
        cities: [['Bentonville', 'Arkansas', 0.22], ['Fayetteville', 'Arkansas', 0.19], ['Rogers', 'Arkansas', 0.15], ['Springdale', 'Arkansas', 0.1], ['Dallas', 'Texas', 0.04], ['(not set)', '(not set)', 0.03]].map(([city, region, f]) => ({ city, region, visitors: Math.round(vis * f) })),
        devices: [{ name: 'mobile', visitors: Math.round(vis * 0.81) }, { name: 'desktop', visitors: Math.round(vis * 0.17) }, { name: 'tablet', visitors: Math.round(vis * 0.02) }],
        hours: Array.from({ length: 24 }, (_, h) => ({ hour: h, visitors: Math.round((h < 6 ? 2 : h < 11 ? 12 : h < 17 ? 18 : h < 22 ? 30 : 8) * (0.7 + r() * 0.6)) })),
        organicLanding: [{ path: '/news/hotel-vin-rogers-hosts-santa-brunch-at-bacchus-on-dec-6-13-and-20/', sessions: 21 }, { path: '/events/', sessions: 12 }],
      },
      gsc: {
        from: '2026-10-28', to: '2026-11-22',
        totals: { clicks: 64, impressions: 2310, ctr: 0.0277, position: 14.2 },
        queries: [['santa brunch rogers', 12, 140, 3.1], ['things to do in bentonville this weekend', 7, 420, 11.4], ['new restaurants fayetteville ar', 5, 390, 9.8], ['nwa christmas parades 2026', 4, 210, 6.2]].map(([query, clicks, impressions, position]) => ({ query, clicks, impressions, ctr: clicks / impressions, position })),
        nearlyThere: [['things to do in bentonville this weekend', 7, 420, 11.4], ['new restaurants fayetteville ar', 5, 390, 9.8], ['rogers events december', 1, 120, 8.7]].map(([query, clicks, impressions, position]) => ({ query, clicks, impressions, ctr: clicks / impressions, position })),
        pages: [{ page: 'https://nwanext.com/news/hotel-vin-rogers-hosts-santa-brunch-at-bacchus-on-dec-6-13-and-20/', clicks: 18 }, { page: 'https://nwanext.com/events/', clicks: 11 }],
        daily: [],
      },
    };
  }

  load();
})();
