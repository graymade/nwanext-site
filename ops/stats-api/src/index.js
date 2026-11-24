// NWA Next stats API: reads Google Analytics 4 and Search Console for nwanext.com/admin/stats/.
// Access: the caller sends the GitHub token the CMS login already stored; only accounts that can
// push to the site repo get data. Google access: an OAuth refresh token for Sam's account
// (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) or a service account key
// (GOOGLE_SA_JSON). All are Worker secrets, never in the repo.

const AI_SOURCES = /chatgpt|openai|perplexity|gemini|bard|copilot|claude|anthropic|you\.com|phind|meta\.ai|deepseek|grok|mistral/i;
const SCOPES = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly';
const RANGES = [7, 28, 90];

export default {
  async fetch(req, env, ctx) {
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' } });

    if (url.pathname === '/health') return json({ ok: true });
    if (url.pathname !== '/stats' || req.method !== 'GET') return json({ error: 'not_found' }, 404);

    const who = await checkGitHub(req, env, ctx);
    if (!who.ok) return json({ error: who.error }, who.status);

    const days = RANGES.includes(Number(url.searchParams.get('days'))) ? Number(url.searchParams.get('days')) : 28;
    const fresh = url.searchParams.get('fresh') === '1';
    const cacheKey = new Request(`https://stats.cache/v2?days=${days}`);
    const cache = caches.default;

    // Note: the Cache API only stores on a custom domain; on workers.dev every load reads Google directly (well inside quota).
    let report = fresh ? null : await cache.match(cacheKey).then((r) => (r ? r.json() : null));
    const cached = !!report;
    let token;
    try {
      token = await googleToken(env);
    } catch (e) {
      return json({ error: 'google_auth', detail: String(e.message || e) }, 502);
    }
    if (!report) {
      const [ga, gsc] = await Promise.all([
        gaReport(env, token, days).catch((e) => ({ error: String(e.message || e) })),
        gscReport(env, token, days).catch((e) => ({ error: String(e.message || e) })),
      ]);
      report = { days, generated: new Date().toISOString(), ga, gsc };
      if (!ga.error) ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(report), { headers: { 'cache-control': 'max-age=1800' } })));
    }
    const realtime = await gaRealtime(env, token).catch((e) => ({ error: String(e.message || e) }));
    return json({ ...report, cached, realtime, user: who.login });
  },
};

function corsHeaders(req, env) {
  const origin = req.headers.get('origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    'access-control-allow-origin': allowed.includes(origin) ? origin : allowed[0] || '',
    'access-control-allow-headers': 'authorization',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

// Only GitHub accounts with push access to the site repo (the CMS editors) may read stats.
async function checkGitHub(req, env, ctx) {
  const m = (req.headers.get('authorization') || '').match(/^Bearer\s+(\S+)$/i);
  if (!m) return { ok: false, status: 401, error: 'sign_in' };
  const key = new Request(`https://auth.cache/${await sha256(m[1])}`);
  const hit = await caches.default.match(key);
  if (hit) return { ok: true, login: await hit.text() };
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}`, {
    headers: { authorization: `Bearer ${m[1]}`, 'user-agent': 'nwanext-stats', accept: 'application/vnd.github+json' },
  });
  if (res.status === 401) return { ok: false, status: 401, error: 'sign_in' };
  if (!res.ok) return { ok: false, status: 403, error: 'no_access' };
  const repo = await res.json();
  if (!repo.permissions?.push) return { ok: false, status: 403, error: 'no_access' };
  const user = await fetch('https://api.github.com/user', {
    headers: { authorization: `Bearer ${m[1]}`, 'user-agent': 'nwanext-stats' },
  }).then((r) => (r.ok ? r.json() : {}));
  const login = user.login || 'editor';
  ctx.waitUntil(caches.default.put(key, new Response(login, { headers: { 'cache-control': 'max-age=600' } })));
  return { ok: true, login };
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Google auth ----------

async function googleToken(env) {
  let body;
  if (env.GOOGLE_REFRESH_TOKEN) {
    body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
    });
  } else if (env.GOOGLE_SA_JSON) {
    const sa = JSON.parse(env.GOOGLE_SA_JSON);
    body = new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: await serviceAccountJwt(sa) });
  } else {
    throw new Error('Google access is not set up yet');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || `token ${res.status}`);
  return data.access_token;
}

export async function serviceAccountJwt(sa, now = Math.floor(Date.now() / 1000)) {
  const b64u = (v) => btoa(typeof v === 'string' ? v : String.fromCharCode(...new Uint8Array(v))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64u(JSON.stringify({ iss: sa.client_email, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----|\s/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${claim}`));
  return `${head}.${claim}.${b64u(sig)}`;
}

async function gPost(url, token, payload) {
  const res = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  return data;
}

// ---------- Google Analytics 4 ----------

const rowsOf = (r) =>
  (r.rows || []).map((row) => ({
    d: (row.dimensionValues || []).map((v) => v.value),
    m: (row.metricValues || []).map((v) => Number(v.value)),
  }));

async function gaReport(env, token, days) {
  if (!env.GA_PROPERTY_ID) throw new Error('GA_PROPERTY_ID is not set');
  const base = `https://analyticsdata.googleapis.com/v1beta/properties/${env.GA_PROPERTY_ID}:batchRunReports`;
  const cur = { startDate: `${days - 1}daysAgo`, endDate: 'today' };
  const prev = { startDate: `${days * 2 - 1}daysAgo`, endDate: `${days}daysAgo` };
  const r = (dims, metrics, extra = {}) => ({
    dateRanges: [cur],
    dimensions: dims.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    ...extra,
  });
  const desc = (metric) => ({ orderBys: [{ metric: { metricName: metric }, desc: true }] });

  const [a, b] = await Promise.all([
    gPost(base, token, {
      requests: [
        { dateRanges: [cur, prev], metrics: ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'userEngagementDuration', 'engagementRate'].map((name) => ({ name })) },
        r(['date'], ['activeUsers', 'screenPageViews'], { orderBys: [{ dimension: { dimensionName: 'date' } }] }),
        r(['pagePath', 'pageTitle'], ['screenPageViews', 'activeUsers'], { ...desc('screenPageViews'), limit: 20 }),
        r(['sessionDefaultChannelGroup'], ['sessions'], desc('sessions')),
        r(['sessionSource'], ['sessions'], { ...desc('sessions'), limit: 50 }),
      ],
    }),
    gPost(base, token, {
      requests: [
        r(['city', 'region'], ['activeUsers'], { ...desc('activeUsers'), limit: 15 }),
        r(['deviceCategory'], ['activeUsers'], desc('activeUsers')),
        { dateRanges: [cur, prev], dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['sign_up', 'tip_sent'] } } } },
        r(['hour'], ['activeUsers'], { orderBys: [{ dimension: { dimensionName: 'hour' } }] }),
        r(['landingPagePlusQueryString'], ['sessions'], { ...desc('sessions'), limit: 10, dimensionFilter: { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Organic Search' } } } }),
      ],
    }),
  ]);

  const [tot, daily, pages, channels, sources] = a.reports;
  const [cities, devices, events, hours, organic] = b.reports;

  // With two date ranges GA adds a dateRange dimension: date_range_0 is the current period.
  const names = ['visitors', 'newVisitors', 'sessions', 'views', 'engagedSeconds', 'engagementRate'];
  const zero = () => Object.fromEntries(names.map((n) => [n, 0]));
  const totals = { cur: zero(), prev: zero() };
  for (const row of rowsOf(tot)) {
    const which = row.d[0] === 'date_range_1' ? 'prev' : 'cur';
    names.forEach((n, i) => (totals[which][n] = row.m[i]));
  }
  const ev = { cur: { sign_up: 0, tip_sent: 0 }, prev: { sign_up: 0, tip_sent: 0 } };
  for (const row of rowsOf(events)) ev[row.d[1] === 'date_range_1' ? 'prev' : 'cur'][row.d[0]] = row.m[0];

  const srcRows = rowsOf(sources).map((x) => ({ source: x.d[0], sessions: x.m[0] }));
  return {
    totals,
    events: ev,
    daily: rowsOf(daily).map((x) => ({ date: x.d[0], visitors: x.m[0], views: x.m[1] })),
    pages: rowsOf(pages).map((x) => ({ path: x.d[0], title: x.d[1], views: x.m[0], visitors: x.m[1] })),
    channels: rowsOf(channels).map((x) => ({ name: x.d[0], sessions: x.m[0] })),
    sources: srcRows.slice(0, 12),
    ai: srcRows.filter((x) => AI_SOURCES.test(x.source)),
    instagram: srcRows.filter((x) => /instagram|^ig$|l\.instagram/i.test(x.source)).reduce((s, x) => s + x.sessions, 0),
    cities: rowsOf(cities).map((x) => ({ city: x.d[0], region: x.d[1], visitors: x.m[0] })),
    devices: rowsOf(devices).map((x) => ({ name: x.d[0], visitors: x.m[0] })),
    hours: rowsOf(hours).map((x) => ({ hour: Number(x.d[0]), visitors: x.m[0] })),
    organicLanding: rowsOf(organic).map((x) => ({ path: x.d[0], sessions: x.m[0] })),
  };
}

async function gaRealtime(env, token) {
  const data = await gPost(`https://analyticsdata.googleapis.com/v1beta/properties/${env.GA_PROPERTY_ID}:runRealtimeReport`, token, {
    dimensions: [{ name: 'unifiedScreenName' }],
    metrics: [{ name: 'activeUsers' }],
    limit: 5,
  });
  const pages = rowsOf(data).map((x) => ({ title: x.d[0], visitors: x.m[0] }));
  const total = await gPost(`https://analyticsdata.googleapis.com/v1beta/properties/${env.GA_PROPERTY_ID}:runRealtimeReport`, token, { metrics: [{ name: 'activeUsers' }] });
  return { active: Number(total.rows?.[0]?.metricValues?.[0]?.value || 0), pages };
}

// ---------- Search Console ----------

async function gscReport(env, token, days) {
  const site = encodeURIComponent(env.GSC_SITE);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`;
  // Search Console data runs about two days behind.
  const end = new Date(Date.now() - 2 * 864e5);
  const start = new Date(end.getTime() - (days - 1) * 864e5);
  const iso = (d) => d.toISOString().slice(0, 10);
  const q = (dims, rowLimit) => gPost(url, token, { startDate: iso(start), endDate: iso(end), dimensions: dims, rowLimit, dataState: 'all' });
  const [tot, queries, pages, daily] = await Promise.all([q([], 1), q(['query'], 250), q(['page'], 25), q(['date'], days)]);
  const pick = (r) => ({ clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
  const qs = (queries.rows || []).map((r) => ({ query: r.keys[0], ...pick(r) }));
  return {
    from: iso(start),
    to: iso(end),
    totals: tot.rows?.[0] ? pick(tot.rows[0]) : { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    queries: qs.slice(0, 25),
    // Seen in search but sitting just off page one: the easiest wins.
    nearlyThere: qs.filter((r) => r.position >= 4 && r.position <= 20 && r.impressions >= 5).sort((x, y) => y.impressions - x.impressions).slice(0, 12),
    pages: (pages.rows || []).map((r) => ({ page: r.keys[0], ...pick(r) })),
    daily: (daily.rows || []).map((r) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions })),
  };
}
