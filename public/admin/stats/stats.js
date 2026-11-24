// nwanext.com/admin/stats/: GA4 and Search Console for the editors, with plain-language takeaways.
// Access: a GitHub token with push on the site repo. Taken from the CMS login (localStorage
// sveltia-cms.user) or from this page's own "Sign in with GitHub" (same login Worker as the CMS).
(() => {
  const qs = new URLSearchParams(location.search);
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  // The API override is for local testing only: on the live site the token must only ever go to our Worker.
  const API = local ? qs.get('api') || 'http://localhost:8799' : 'https://nwanext-stats.graymade.workers.dev';
  const AUTH = 'https://nwanext-cms-auth.graymade.workers.dev';
  const OWN_KEY = 'nwa-stats.github';
  const DEMO = qs.has('demo');
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // Only link to pages on this site; Analytics paths can be spammed.
  const href = (u) => {
    const v = String(u || '');
    if (/[\\\s\x00-\x1f]/.test(v)) return '#';
    try {
      const url = new URL(v, location.origin);
      return url.origin === location.origin || url.origin === 'https://nwanext.com' ? esc(location.origin + url.pathname.replace(/^\/+/, '/') + url.search) : '#';
    } catch { return '#'; }
  };
  const fmt = (n) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : Math.round(n || 0).toLocaleString('en-US'));
  const pct = (n) => `${(n * 100).toFixed(n > 0 && n < 0.1 ? 1 : 0)}%`;
  const mins = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s || 0)}s`);
  const plural = (n, one, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const CHANNEL = {
    'Organic Social': 'social media, mostly Instagram',
    'Organic Search': 'search engines',
    Direct: 'a saved link or the typed address',
    Referral: 'links on other websites',
    Unassigned: 'sources Google could not tell',
    'Organic Video': 'video sites',
    Email: 'email',
  };
  const IG = /instagram|^ig$/i;
  let days = Number(localStorage.getItem('nwa-stats-days')) || 28;
  let index = null; // story titles, towns and dates from /search-index.json

  // ---------- sign-in ----------

  function tokens() {
    const out = [];
    try { const own = JSON.parse(localStorage.getItem(OWN_KEY) || 'null'); if (own?.token) out.push(own.token); } catch {}
    try { const cms = JSON.parse(localStorage.getItem('sveltia-cms.user') || 'null'); if (cms?.token) out.push(cms.token); } catch {}
    return [...new Set(out)];
  }

  function signInBox(lead) {
    status(`<p><b>${lead}</b></p><p>Your login is your GitHub account, the same one you use for the editor. Only accounts that can edit the site see stats.</p><p><button type="button" class="btn" id="signin">Sign in with GitHub</button></p>`);
    $('signin').addEventListener('click', signIn);
  }

  function signIn() {
    if (local) { status('<p>Sign-in only works on nwanext.com. Locally, open the page with <code>?demo</code>.</p>'); return; }
    const authOrigin = new URL(AUTH).origin;
    const w = 600, h = 700;
    const popup = window.open(`${AUTH}/auth?provider=github&site_id=${encodeURIComponent(location.hostname)}&scope=repo`, 'nwa-stats-login',
      `width=${w},height=${h},left=${(screen.width - w) / 2},top=${(screen.height - h) / 2}`);
    if (!popup) { status('<p><b>The sign-in window was blocked.</b> Allow pop-ups for nwanext.com and try again.</p>'); return; }
    const onMsg = (e) => {
      if (e.origin !== authOrigin || typeof e.data !== 'string') return;
      if (e.data === 'authorizing:github') { popup.postMessage('authorizing:github', authOrigin); return; }
      const m = e.data.match(/^authorization:github:(success|error):(.*)$/s);
      if (!m) return;
      removeEventListener('message', onMsg);
      try {
        const body = JSON.parse(m[2]);
        if (m[1] === 'success' && body.token) {
          localStorage.setItem(OWN_KEY, JSON.stringify({ token: body.token }));
          popup.close();
          load();
        } else {
          status(`<p><b>GitHub sign-in didn’t finish.</b></p><p class="small">${esc(body.error || '')}</p>`);
        }
      } catch { status('<p><b>GitHub sign-in didn’t finish.</b> Try again.</p>'); }
    };
    addEventListener('message', onMsg);
  }

  function status(html, cls = '') {
    const el = $('status');
    el.className = `note ${cls}`;
    el.innerHTML = html;
    el.hidden = false;
  }

  // ---------- data ----------

  async function load(fresh = false) {
    document.querySelectorAll('.range button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.days) === days)));
    const extras = loadExtras();
    if (DEMO) { const ex = await extras; return render(demoData(days), ex, true); }
    const list = tokens();
    if (!list.length) return signInBox('Sign in to see the stats.');
    status('Loading…');
    let data, res;
    for (const t of list) {
      try {
        res = await fetch(`${API}/stats?days=${days}${fresh ? '&fresh=1' : ''}`, { headers: { authorization: `Bearer ${t}` } });
        data = await res.json();
      } catch {
        return status('<p><b>Couldn’t reach the stats service.</b> Check the connection and reload.</p>');
      }
      if (data.error !== 'sign_in') break;
    }
    if (data.error === 'sign_in') { localStorage.removeItem(OWN_KEY); return signInBox('Your login has expired.'); }
    if (data.error === 'no_access') return status('<p><b>This GitHub account can’t edit the site,</b> so it can’t see stats.</p>');
    if (data.error === 'google_auth') return status(`<p><b>Google isn’t connected.</b> The stats service lost its read access to Analytics and Search Console.</p><p class="small">${esc(data.detail)}</p>`);
    if (!res.ok) return status(`<p><b>Something went wrong.</b></p><p class="small">${esc(data.error)}</p>`);
    render(data, await extras, false);
  }

  // Public files from the site itself: story titles and towns, and when the site last deployed.
  async function loadExtras() {
    const [idx, version] = await Promise.all([
      index ? Promise.resolve(index) : fetch('/search-index.json').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/version.txt', { cache: 'no-store' }).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
    ]);
    index = idx;
    return { index: idx, version: version.trim() };
  }

  const norm = (p) => { const s = String(p || '').split(/[?#]/)[0]; return s.endsWith('/') ? s : `${s}/`; };
  function pageInfo(path, extras) {
    const p = norm(path);
    const hit = extras.index.find((e) => e.u === p);
    if (hit) return { title: hit.t, town: hit.k === 'story' ? String(hit.m || '').split(' · ')[0] : '', kind: hit.k, date: hit.d };
    const named = { '/': 'Home', '/links/': 'Instagram links page', '/events/': 'Events', '/calendar/': 'Calendar', '/openings/': 'New spots', '/news/': 'All news', '/cities/': 'Towns', '/submit/': 'Send a tip', '/newsletter/': 'Newsletter', '/about/': 'About', '/search/': 'Search', '/connect/': 'Get connected', '/guides/': 'Guides', '/privacy/': 'Privacy', '/credits/': 'Photo credits' };
    return { title: named[p] || p, town: '', kind: 'page' };
  }

  // ---------- render ----------

  function render(d, extras, demo) {
    if (demo) status('<p><b>Sample data.</b> These numbers are made up to check the layout. Remove <code>?demo</code> from the address to see the real ones.</p>', 'demo');
    else $('status').hidden = true;
    $('out').hidden = false;
    const ga = d.ga || {};
    const gsc = d.gsc || {};
    const rt = d.realtime || {};

    $('live').innerHTML = rt.error ? '' : `<i class="dot${rt.active ? '' : ' off'}" aria-hidden="true"></i><b>${plural(rt.active || 0, 'person', 'people')} on the site right now</b>${(rt.pages || []).length ? ` <span>reading ${rt.pages.slice(0, 2).map((p) => esc(cleanTitle(p.title))).join(' and ')}</span>` : ''}`;

    if (ga.error) {
      $('summary').textContent = `Analytics: ${ga.error}`;
      ['tiles', 'todo'].forEach((id) => ($(id).innerHTML = ''));
    } else {
      const c = ga.totals.cur, p = ga.totals.prev;
      const per = c.visitors ? c.engagedSeconds / c.visitors : 0;
      const perPrev = p.visitors ? p.engagedSeconds / p.visitors : 0;
      const ret = ga.returning || { cur: 0, prev: 0 };
      const tiles = [
        ['Visitors', fmt(c.visitors), c.visitors, p.visitors],
        ['Came back', fmt(ret.cur), ret.cur, ret.prev, 'Visitors who had been here before'],
        ['Page views', fmt(c.views), c.views, p.views],
        ['Time per visitor', mins(per), per, perPrev, 'Time with the page in front of them'],
        ['Newsletter signups', fmt(ga.events.cur.sign_up), ga.events.cur.sign_up, ga.events.prev.sign_up],
        ['Tips sent', fmt(ga.events.cur.tip_sent), ga.events.cur.tip_sent, ga.events.prev.tip_sent],
      ];
      $('tiles').innerHTML = tiles.map(([k, v, a, b, hint]) => `<div class="tile"${hint ? ` title="${esc(hint)}"` : ''}><div class="k">${k}</div><div class="v">${v}</div>${delta(a, b)}</div>`).join('');

      $('summary').innerHTML = summary(d, extras);
      $('todo').innerHTML = todos(d, extras).map((t) => `<li><b>${t.title}</b><span>${t.body}</span></li>`).join('') || '<li><b>Nothing urgent.</b><span>Keep posting; the numbers will start to tell a story once there are a few weeks of them.</span></li>';

      const series = fillDays(ga.daily, ga.prevDaily || [], d.days);
      const hasPrev = series.some((s) => s.p > 0);
      $('legend').innerHTML = hasPrev ? '<span><i class="sw now"></i>This period</span><span><i class="sw before"></i>The period before</span>' : '';
      lineChart($('daily'), series, hasPrev);

      // Stories and other pages
      const stories = (ga.stories || []).map((r) => ({ ...r, info: pageInfo(r.path, extras) }));
      $('stories').innerHTML = stories.length
        ? `<div class="scroll"><table><thead><tr><th scope="col">Story</th><th scope="col">Town</th><th scope="col">Views</th><th scope="col">Time</th></tr></thead><tbody>${stories.slice(0, 12).map((r) => `<tr><td><a href="${href(r.path)}">${esc(r.info.title)}</a></td><td class="muted">${esc(r.info.town)}</td><td>${fmt(r.views)}</td><td class="muted">${r.visitors ? mins(r.engagedSeconds / r.visitors) : ''}</td></tr>`).join('')}</tbody></table></div>`
        : '<p class="small">No story views yet.</p>';
      // GA can list one path under two titles; add those together.
      const merged = Object.values(ga.pages.filter((r) => !r.path.startsWith('/news/') || r.path === '/news/').reduce((acc, r) => {
        const k = norm(r.path); acc[k] = acc[k] ? { ...acc[k], views: acc[k].views + r.views } : { ...r, path: k }; return acc;
      }, {})).sort((a, b) => b.views - a.views);
      rows($('pages'), merged.map((r) => ({ label: `<a href="${href(r.path)}">${esc(pageInfo(r.path, extras).title)}</a>`, n: r.views, unit: 'views' })));

      // Where from
      const totalSessions = ga.channels.reduce((s, r) => s + r.sessions, 0) || 1;
      rows($('channels'), ga.channels.map((r) => ({ label: `${esc(r.name)} <span class="muted">${pct(r.sessions / totalSessions)}</span>`, n: r.sessions, unit: 'visits' })));
      rows($('sources'), ga.sources.map((r) => ({ label: esc(r.source), n: r.sessions, unit: 'visits', hi: IG.test(r.source) })));
      rows($('instagram'), (ga.instagramLanding || []).map((r) => ({ label: `<a href="${href(norm(r.path))}">${esc(pageInfo(r.path, extras).title)}</a>`, n: r.sessions, unit: 'visits', hi: true })), 'No visits from Instagram links yet in this period.');
      rows($('ai'), ga.ai.map((r) => ({ label: esc(r.source), n: r.sessions, unit: 'visits' })), 'None yet. These show up once answer engines start citing nwanext.com.');

      // Who and when
      $('towns').innerHTML = townsTable(ga.cities, extras);
      const wmax = Math.max(1, ...ga.weekdays.map((x) => x.visitors));
      const byDay = Object.fromEntries(ga.weekdays.map((x) => [x.day, x.visitors]));
      $('weekdays').innerHTML = DAYS.map((name, i) => `<span class="b" data-tip="${name}: ${plural(byDay[i] || 0, 'visitor')}"><i style="block-size:${((byDay[i] || 0) / wmax) * 100}%"></i><small>${name.slice(0, 3)}</small></span>`).join('');
      const hmax = Math.max(1, ...ga.hours.map((x) => x.visitors));
      const byHour = Object.fromEntries(ga.hours.map((x) => [x.hour, x.visitors]));
      $('hours').innerHTML = Array.from({ length: 24 }, (_, h) => `<span class="b" data-tip="${hourName(h)}: ${plural(byHour[h] || 0, 'visitor')}"><i style="block-size:${((byHour[h] || 0) / hmax) * 100}%"></i><small>${h % 6 === 0 ? hourName(h).replace(' ', '').toLowerCase() : ''}</small></span>`).join('');
      $('besttime').textContent = bestTime(ga) || 'Not enough visits yet to call a best time to post.';
      rows($('devices'), ga.devices.map((r) => ({ label: esc(r.name[0].toUpperCase() + r.name.slice(1)), n: r.visitors, unit: 'visitors' })));
    }

    renderGsc(gsc, ga.organicLanding || [], extras);
    renderHealth(d, extras);
    $('foot').innerHTML = `Analytics covers the last ${Number(d.days) | 0} days including today, Central time. Search data runs about two days behind. Updated ${new Date(d.generated).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.${d.cached ? ' <button type="button" class="btn" id="fresh">Refresh now</button>' : ''}`;
    $('fresh')?.addEventListener('click', () => load(true));
  }

  // ---------- plain-language takeaways ----------

  function summary(d, extras) {
    const ga = d.ga, c = ga.totals.cur, p = ga.totals.prev;
    const span = d.days === 7 ? 'week' : `${d.days} days`;
    const out = [];
    let first = `In the last ${span}, <b>${plural(c.visitors, 'person', 'people')}</b> visited nwanext.com and viewed ${plural(c.views, 'page')}`;
    if (p.visitors >= 5) { const ch = (c.visitors - p.visitors) / p.visitors; first += Math.abs(ch) >= 0.05 ? `, ${ch > 0 ? 'up' : 'down'} ${pct(Math.abs(ch))} on the ${span} before` : ', about the same as the period before'; }
    out.push(`${first}.`);
    const total = ga.channels.reduce((s, r) => s + r.sessions, 0);
    if (ga.channels[0] && total) out.push(`Most came from ${CHANNEL[ga.channels[0].name] || ga.channels[0].name.toLowerCase()} (${pct(ga.channels[0].sessions / total)}).`);
    const top = (ga.stories || [])[0];
    if (top) out.push(`The most-read story was <a href="${href(top.path)}">${esc(pageInfo(top.path, extras).title)}</a> with ${plural(top.views, 'view')}.`);
    const town = (ga.cities || []).find((x) => x.city && x.city !== '(not set)');
    const counts = townStories(extras);
    const localTown = (ga.cities || []).find((x) => counts[x.city] !== undefined);
    if (town && localTown && town !== localTown) out.push(`The most readers were in ${esc(town.city)}${town.region && town.region !== 'Arkansas' ? `, ${esc(town.region)}` : ''}; locally, ${esc(localTown.city)} led.`);
    else if (town) out.push(`The most readers were in ${esc(town.city)}.`);
    const su = ga.events.cur.sign_up, tips = ga.events.cur.tip_sent;
    out.push(su || tips ? `${plural(su, 'newsletter signup')} and ${plural(tips, 'tip')} came in.` : 'No newsletter signups or tips came in.');
    return out.join(' ');
  }

  function todos(d, extras) {
    const ga = d.ga, g = d.gsc || {}, c = ga.totals.cur;
    const list = [];
    const total = ga.channels.reduce((s, r) => s + r.sessions, 0) || 1;
    const social = ga.channels.filter((r) => /Social/.test(r.name)).reduce((s, r) => s + r.sessions, 0);
    const search = ga.channels.filter((r) => /Search/.test(r.name)).reduce((s, r) => s + r.sessions, 0);

    if (g.error) list.push({ title: 'Reconnect Search Console.', body: `The stats service can’t read it: ${esc(g.error)}` });
    else if (!g.totals?.impressions) list.push({ title: 'Give Google a few days.', body: 'Search Console was set up on Nov 24, 2026. Searches, clicks and rankings usually start showing two to three days later, and grow over the first weeks.' });

    for (const q of (g.nearlyThere || []).slice(0, 2)) list.push({ title: `Push “${esc(q.query)}” onto page one.`, body: `nwanext.com shows up around position ${q.position.toFixed(0)} for it (${plural(q.impressions, 'time')} this period). A headline and first sentence that answer that search directly, plus links from related stories, can lift it.` });
    for (const pg of (g.lowClick || []).slice(0, 2)) {
      let path = pg.page; try { path = new URL(pg.page).pathname; } catch {}
      list.push({ title: `Rewrite the headline of ${esc(pageInfo(path, extras).title)}.`, body: `Google showed it ${plural(pg.impressions, 'time')} but it got ${plural(pg.clicks, 'click')}. Lead with the name, place and date people search for.` });
    }

    const organicTop = (ga.organicLanding || [])[0];
    if (organicTop && organicTop.sessions >= 3 && organicTop.path.startsWith('/news/')) list.push({ title: `Follow up on ${esc(pageInfo(organicTop.path, extras).title)}.`, body: `It’s the story search engines send people to most (${plural(organicTop.sessions, 'visit')}). An update or a related story keeps it ranking and gives searchers somewhere to go next.` });

    if (c.visitors >= 20 && social / total < 0.25) list.push({ title: 'Send more Instagram followers to the site.', body: `Only ${pct(social / total)} of visits come from social media. Add a link sticker to Instagram stories when a post has a full write-up, and keep nwanext.com/links/ in the bio.` });
    if (c.visitors >= 20 && search / total < 0.15) list.push({ title: 'Build the search side.', body: `Search engines send ${pct(search / total)} of visits. Evergreen pages like “things to do in Bentonville this weekend” and “new restaurants in Fayetteville” are next on the build list.` });

    if (c.visitors >= 20 && !ga.events.cur.sign_up) list.push({ title: 'Ask for newsletter signups.', body: `${plural(c.visitors, 'visitor')} and no signups yet. Mention the newsletter on Instagram with the link, and pin a post about it.` });
    if (c.visitors >= 20 && !(ga.returning || {}).cur) list.push({ title: 'Give people a reason to come back.', body: 'Nobody has come back yet. The newsletter and the calendar subscribe link are the two ways the site brings readers back.' });

    const gap = townGap(ga.cities, extras);
    if (gap) list.push({ title: `Cover more of ${esc(gap.town)}.`, body: `${plural(gap.visitors, 'reader')} came from ${esc(gap.town)}, but the site has only ${plural(gap.stories, 'story', 'stories')} about it.` });

    const upcoming = (extras.index || []).filter((e) => e.k === 'story' && /Event/.test(e.m || '') && e.d >= todayISO()).length;
    if (upcoming < 3) list.push({ title: 'Add upcoming events.', body: `The site lists ${plural(upcoming, 'upcoming event')}. The Events page and weekend searches need a steady supply.` });

    const bt = bestTime(ga);
    if (bt) list.push({ title: 'Post when readers are around.', body: bt });
    return list.slice(0, 7);
  }

  function bestTime(ga) {
    const total = ga.hours.reduce((s, h) => s + h.visitors, 0);
    if (total < 30) return '';
    const day = [...ga.weekdays].sort((a, b) => b.visitors - a.visitors)[0];
    const by = Object.fromEntries(ga.hours.map((h) => [h.hour, h.visitors]));
    let best = 0, start = 0;
    for (let h = 0; h < 24; h++) { const s = (by[h] || 0) + (by[(h + 1) % 24] || 0) + (by[(h + 2) % 24] || 0); if (s > best) { best = s; start = h; } }
    return `Most visits come on ${DAYS[day.day]}s, and the busiest hours are ${hourName(start)} to ${hourName((start + 3) % 24)}. Posting just before then gives a story the best start.`;
  }

  function townStories(extras) {
    const out = {};
    for (const e of extras.index || []) if (e.k === 'city') out[e.t] = Number((String(e.m || '').match(/(\d+) stor/) || [])[1] || 0);
    return out;
  }
  function townsTable(cities, extras) {
    const counts = townStories(extras);
    const list = (cities || []).filter((x) => x.city && x.city !== '(not set)');
    if (!list.length) return '<p class="small">No town data yet.</p>';
    return `<div class="scroll"><table><thead><tr><th scope="col">Town</th><th scope="col">Visitors</th><th scope="col">Stories</th></tr></thead><tbody>${list.slice(0, 10).map((x) => {
      const n = counts[x.city];
      return `<tr><td>${esc(x.city)}${n === undefined ? ` <span class="muted">${esc(x.region && x.region !== 'Arkansas' ? x.region : 'outside the area')}</span>` : ''}</td><td>${fmt(x.visitors)}</td><td class="muted">${n === undefined ? '' : fmt(n)}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function townGap(cities, extras) {
    const counts = townStories(extras);
    const inArea = (cities || []).filter((x) => counts[x.city] !== undefined);
    const readers = inArea.reduce((s, x) => s + x.visitors, 0);
    const stories = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
    if (readers < 15) return null;
    return inArea
      .map((x) => ({ town: x.city, visitors: x.visitors, stories: counts[x.city], gap: x.visitors / readers - counts[x.city] / stories }))
      .filter((x) => x.visitors >= 5 && x.gap > 0.1)
      .sort((a, b) => b.gap - a.gap)[0] || null;
  }

  // ---------- search ----------

  function renderGsc(g, organic, extras) {
    const el = $('gsc');
    if (g.error) {
      el.innerHTML = `<div class="note"><p><b>Search Console isn’t readable right now.</b></p><p class="small">${esc(g.error)}</p></div>`;
      return;
    }
    const t = g.totals;
    const sm = (g.sitemaps || [])[0];
    el.innerHTML = `
      <div class="tiles">
        <div class="tile"><div class="k">Clicks from Google</div><div class="v">${fmt(t.clicks)}</div></div>
        <div class="tile"><div class="k">Times shown in results</div><div class="v">${fmt(t.impressions)}</div></div>
        <div class="tile"><div class="k">Click rate</div><div class="v">${t.impressions ? pct(t.ctr || 0) : '–'}</div></div>
        <div class="tile"><div class="k">Average position</div><div class="v">${t.position ? t.position.toFixed(1) : '–'}</div><div class="d">${t.position ? (t.position <= 10 ? 'Page one on average' : `Page ${Math.ceil(t.position / 10)} on average`) : '&nbsp;'}</div></div>
      </div>
      ${t.impressions ? '' : `<p class="note">Google started tracking nwanext.com on Nov 24, 2026. The first searches and clicks show up here about two to three days later.${sm ? ` Google has read the sitemap (${plural(sm.submitted, 'page')} listed${sm.errors ? `, ${plural(sm.errors, 'error')}` : ', no errors'}).` : ''}</p>`}
      <div class="grid2">
        <div class="card"><h3>What people search</h3>${table(g.queries, 'No searches recorded yet.')}</div>
        <div class="card"><h3>Close to page one</h3><p class="small">Searches where a story shows up at positions 4 to 20. A clearer headline or first sentence, or links from related stories, can push these up.</p>${table(g.nearlyThere, 'Nothing here yet. Check back once Google has a few weeks of data.')}</div>
      </div>
      <div class="grid2">
        <div class="card"><h3>Pages search sends people to</h3><ul class="rows" id="gpages"></ul></div>
        <div class="card"><h3>Shown but rarely clicked</h3><p class="small">Pages Google shows often that few people tap. Rewrite these headlines and summaries first.</p><ul class="rows" id="lowclick"></ul></div>
      </div>
      <p class="small">${esc(g.from)} to ${esc(g.to)}</p>`;
    const path = (u) => { try { return new URL(u).pathname; } catch { return u; } };
    const clicked = g.pages.filter((r) => r.clicks);
    if (clicked.length) rows($('gpages'), clicked.map((r) => ({ label: `<a href="${href(r.page)}">${esc(pageInfo(path(r.page), extras).title)}</a>`, n: r.clicks, unit: 'clicks from Google' })));
    else rows($('gpages'), organic.map((r) => ({ label: `<a href="${href(norm(r.path))}">${esc(pageInfo(r.path, extras).title)}</a>`, n: r.sessions, unit: 'visits from search engines' })), 'No visits from search yet.');
    rows($('lowclick'), (g.lowClick || []).map((r) => ({ label: `<a href="${href(r.page)}">${esc(pageInfo(path(r.page), extras).title)}</a> <span class="muted">${fmt(r.impressions)} shown</span>`, n: r.clicks, unit: 'clicks' })), 'None yet.');
  }

  function renderHealth(d, extras) {
    const idx = extras.index || [];
    const storiesN = idx.filter((e) => e.k === 'story').length;
    const upcoming = idx.filter((e) => e.k === 'story' && /Event/.test(e.m || '') && e.d >= todayISO()).length;
    const sm = (d.gsc?.sitemaps || [])[0];
    const deployed = extras.version ? new Date(extras.version) : null;
    const items = [
      ['Last site update', deployed && !isNaN(deployed) ? `${ago(deployed)} <span class="muted">${deployed.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>` : 'Unknown'],
      ['Stories on the site', fmt(storiesN)],
      ['Upcoming events listed', fmt(upcoming)],
      ['Instagram to website', 'Checks the feed every hour and adds new posts'],
      ['Google sitemap', sm ? `${plural(sm.submitted, 'page')} listed, last read ${ago(new Date(sm.lastDownloaded))}${sm.errors ? `, <b>${plural(sm.errors, 'error')}</b>` : ', no errors'}` : 'Not submitted'],
      ['Bing', 'Imported from Search Console'],
    ];
    $('health').innerHTML = items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }

  // ---------- helpers ----------

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
    return `<div class="d ${ch > 0 ? 'up' : 'down'}">${ch > 0 ? 'Up' : 'Down'} ${pct(Math.abs(ch))} on the period before</div>`;
  }

  const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const ago = (dt) => {
    const s = (Date.now() - dt.getTime()) / 1000;
    if (s < 90) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} minutes ago`;
    if (s < 86400 * 2) return `${Math.round(s / 3600)} hours ago`;
    return `${Math.round(s / 86400)} days ago`;
  };
  const cleanTitle = (t) => String(t || '').replace(/\s*\|\s*NWA Next$/, '');
  const hourName = (h) => (h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`);
  const dayName = (s) => new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // One point per day: GA skips days with no visits, so fill those with zero. With no earlier data
  // to compare, start at the first day with visits instead of a long flat line.
  function fillDays(rows, prev, n) {
    const by = Object.fromEntries(rows.map((r) => [r.date, r]));
    const prevBy = Object.fromEntries(prev.map((r) => [r.n, r.visitors]));
    const hasPrev = prev.some((r) => r.visitors > 0);
    const first = rows.length ? rows[0].date : null;
    const out = [];
    for (let i = n - 1, k = 0; i >= 0; i--, k++) {
      const dt = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }).replace(/-/g, '');
      if (!hasPrev && first && dt < first && !out.length) continue;
      const r = by[dt];
      out.push({ x: dt, y: r ? r.visitors : 0, v: r ? r.views : 0, p: prevBy[k] || 0 });
    }
    return out;
  }

  // Visitors per day, with the period before as a dashed line when there is one.
  function lineChart(el, pts, hasPrev) {
    if (!pts.length) { el.innerHTML = '<p class="small">No visits recorded yet.</p>'; return; }
    const W = el.clientWidth || 800, H = el.clientHeight || 220, L = 34, R = 8, T = 8, B = 24;
    const max = Math.max(4, ...pts.map((p) => Math.max(p.y, hasPrev ? p.p : 0)));
    const step = niceStep(max);
    const top = Math.ceil(max / step) * step;
    const x = (i) => L + (pts.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (pts.length - 1));
    const y = (v) => T + (H - T - B) * (1 - v / top);
    const path = (key) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join('');
    const line = path('y');
    const grid = [];
    for (let v = 0; v <= top; v += step) grid.push(`<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`);
    const every = Math.ceil(pts.length / 6);
    const xl = pts.map((p, i) => (i % every === 0 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${dayName(p.x).replace(/^\w+, /, '')}</text>` : '')).join('');
    const total = pts.reduce((s, p) => s + p.y, 0);
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitors per day, ${fmt(total)} in total">
      <g class="grid axis">${grid.join('')}</g><g class="axis">${xl}</g>
      ${hasPrev ? `<path class="line before" d="${path('p')}"/>` : ''}
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
      tip.textContent = `${dayName(p.x)}: ${plural(p.y, 'visitor')}, ${plural(p.v, 'view')}${hasPrev ? ` (period before: ${fmt(p.p)})` : ''}`;
      const tx = r.left + (x(i) / W) * r.width;
      tip.style.left = `${Math.min(innerWidth - tip.offsetWidth - 8, Math.max(8, tx - tip.offsetWidth / 2))}px`;
      tip.style.top = `${r.top + (y(p.y) / H) * r.height - tip.offsetHeight - 12}px`;
    };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); pt.setAttribute('visibility', 'hidden'); });
  }
  const niceStep = (max) => { const raw = max / 4, mag = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw); };

  // Bar tooltips (days and hours).
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
  let rz, lastW = innerWidth;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (Math.abs(innerWidth - lastW) > 40 && !$('out').hidden) { lastW = innerWidth; load(); } }, 300); });

  // Made-up numbers for checking the layout (?demo).
  function demoData(n) {
    let s = 7; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const daily = Array.from({ length: n }, (_, i) => {
      const d = new Date(Date.now() - (n - 1 - i) * 864e5);
      const v = Math.round(40 + i * 1.5 + r() * 35 + (d.getDay() === 0 || d.getDay() === 6 ? 25 : 0));
      return { date: d.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }).replace(/-/g, ''), visitors: v, views: Math.round(v * (1.8 + r())) };
    });
    const vis = daily.reduce((a, b) => a + b.visitors, 0);
    return {
      days: n, generated: new Date().toISOString(),
      realtime: { active: 3, pages: [{ title: 'Hotel Vin Rogers hosts Santa Brunch | NWA Next', visitors: 2 }, { title: 'Events | NWA Next', visitors: 1 }] },
      ga: {
        totals: { cur: { visitors: vis, newVisitors: Math.round(vis * 0.78), sessions: Math.round(vis * 1.3), views: Math.round(vis * 2.4), engagedSeconds: vis * 71, engagementRate: 0.58 }, prev: { visitors: Math.round(vis * 0.8), newVisitors: Math.round(vis * 0.7), sessions: vis, views: Math.round(vis * 2), engagedSeconds: vis * 60, engagementRate: 0.55 } },
        events: { cur: { sign_up: 0, tip_sent: 3 }, prev: { sign_up: 0, tip_sent: 0 } },
        returning: { cur: Math.round(vis * 0.12), prev: Math.round(vis * 0.08) },
        daily,
        prevDaily: Array.from({ length: n }, (_, i) => ({ n: i, visitors: Math.round(30 + i + r() * 25) })),
        pages: [['/', 'Home'], ['/events/', 'Events'], ['/links/', 'Links'], ['/openings/', 'New spots'], ['/cities/bentonville/', 'Bentonville'], ['/calendar/', 'Calendar']].map(([path, title], i) => ({ path, title, views: Math.round(vis / (i + 1.4)), visitors: Math.round(vis / (i + 2)) })),
        stories: (index || []).filter((e) => e.k === 'story').slice(0, 10).map((e, i) => ({ path: e.u, views: Math.round(vis / (i + 3)), visitors: Math.round(vis / (i + 4)), engagedSeconds: Math.round((vis / (i + 4)) * (40 + r() * 60)) })),
        channels: [['Organic Social', 0.46], ['Direct', 0.27], ['Organic Search', 0.18], ['Referral', 0.07], ['Unassigned', 0.02]].map(([name, f]) => ({ name, sessions: Math.round(vis * 1.3 * f) })),
        sources: [['l.instagram.com', 0.4], ['(direct)', 0.27], ['google', 0.16], ['instagram.com', 0.06], ['bing', 0.02], ['chatgpt.com', 0.01]].map(([source, f]) => ({ source, sessions: Math.round(vis * 1.3 * f) })),
        instagramLanding: [{ path: '/links', sessions: 40 }, { path: '/guides/free-things-to-do', sessions: 12 }, { path: '/events', sessions: 9 }],
        ai: [{ source: 'chatgpt.com', sessions: 9 }, { source: 'perplexity.ai', sessions: 3 }],
        cities: [['Bentonville', 'Arkansas', 0.22], ['Springdale', 'Arkansas', 0.21], ['Fayetteville', 'Arkansas', 0.19], ['Rogers', 'Arkansas', 0.15], ['Dallas', 'Texas', 0.04], ['(not set)', '(not set)', 0.03]].map(([city, region, f]) => ({ city, region, visitors: Math.round(vis * f) })),
        devices: [{ name: 'mobile', visitors: Math.round(vis * 0.81) }, { name: 'desktop', visitors: Math.round(vis * 0.17) }, { name: 'tablet', visitors: Math.round(vis * 0.02) }],
        hours: Array.from({ length: 24 }, (_, h) => ({ hour: h, visitors: Math.round((h < 6 ? 2 : h < 11 ? 12 : h < 17 ? 18 : h < 22 ? 30 : 8) * (0.7 + r() * 0.6)) })),
        weekdays: Array.from({ length: 7 }, (_, d) => ({ day: d, visitors: Math.round((d === 0 || d === 6 ? 60 : 35) * (0.8 + r() * 0.4)) })),
        organicLanding: [{ path: '/news/hotel-vin-rogers-hosts-santa-brunch-at-bacchus-on-dec-6-13-and-20', sessions: 21 }, { path: '/events', sessions: 12 }],
      },
      gsc: {
        from: '2026-10-28', to: '2026-11-22',
        totals: { clicks: 64, impressions: 2310, ctr: 0.0277, position: 14.2 },
        queries: [['santa brunch rogers', 12, 140, 3.1], ['things to do in bentonville this weekend', 7, 420, 11.4], ['new restaurants fayetteville ar', 5, 390, 9.8], ['nwa christmas parades 2026', 4, 210, 6.2]].map(([query, clicks, impressions, position]) => ({ query, clicks, impressions, ctr: clicks / impressions, position })),
        nearlyThere: [['things to do in bentonville this weekend', 7, 420, 11.4], ['new restaurants fayetteville ar', 5, 390, 9.8]].map(([query, clicks, impressions, position]) => ({ query, clicks, impressions, ctr: clicks / impressions, position })),
        pages: [{ page: 'https://nwanext.com/events/', clicks: 18, impressions: 300, ctr: 0.06, position: 8 }, { page: 'https://nwanext.com/', clicks: 11, impressions: 200, ctr: 0.05, position: 5 }],
        lowClick: [{ page: 'https://nwanext.com/openings/', clicks: 1, impressions: 180, ctr: 0.005, position: 12 }],
        sitemaps: [{ path: 'https://nwanext.com/sitemap.xml', lastSubmitted: new Date().toISOString(), lastDownloaded: new Date().toISOString(), pending: false, errors: 0, warnings: 0, submitted: 260 }],
        daily: [],
      },
    };
  }

  load();
})();
