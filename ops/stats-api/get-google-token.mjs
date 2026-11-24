// One-time setup: sign in with the Google account that owns the GA4 property and Search Console,
// then store the read-only refresh token as Worker secrets. Nothing is printed or written to disk.
// Usage (from ops/stats-api): node get-google-token.mjs ~/Downloads/client_secret_XXXX.json
// The JSON is the "Desktop app" OAuth client downloaded from Google Cloud (APIs & Services, Credentials).
import http from 'node:http';
import { readFileSync, unlinkSync } from 'node:fs';
import { spawn, execFile } from 'node:child_process';

const file = process.argv[2];
if (!file) { console.error('Pass the path to the OAuth client JSON.'); process.exit(1); }
const conf = JSON.parse(readFileSync(file, 'utf8'));
const { client_id, client_secret } = conf.installed || conf.web || {};
if (!client_id || !client_secret) { console.error('That file has no client_id/client_secret.'); process.exit(1); }

const scope = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly';
const server = http.createServer();
server.listen(0, '127.0.0.1', () => {
  const redirect = `http://127.0.0.1:${server.address().port}/`;
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  Object.entries({ client_id, redirect_uri: redirect, response_type: 'code', scope, access_type: 'offline', prompt: 'consent' })
    .forEach(([k, v]) => auth.searchParams.set(k, v));
  console.log('Opening Google sign-in in your browser. Pick the account that owns the NWA Next Analytics property.');
  execFile('open', [auth.toString()]);
  server.on('request', async (req, res) => {
    const code = new URL(req.url, redirect).searchParams.get('code');
    if (!code) { res.end('No code. Close this tab and run the script again.'); return; }
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({ code, client_id, client_secret, redirect_uri: redirect, grant_type: 'authorization_code' }),
    });
    const data = await r.json();
    if (!data.refresh_token) { res.end('Google sent no refresh token. Close this tab and run again.'); console.error(data.error_description || data.error || 'no refresh token'); server.close(); process.exit(1); }
    res.end('Done. You can close this tab.');
    server.close();
    for (const [name, value] of [['GOOGLE_CLIENT_ID', client_id], ['GOOGLE_CLIENT_SECRET', client_secret], ['GOOGLE_REFRESH_TOKEN', data.refresh_token]]) {
      await new Promise((ok, fail) => {
        const p = spawn('npx', ['wrangler', 'secret', 'put', name], { stdio: ['pipe', 'ignore', 'inherit'] });
        p.stdin.end(value);
        p.on('exit', (c) => (c === 0 ? ok() : fail(new Error(`wrangler secret put ${name} failed`))));
      });
      console.log(`Saved ${name}`);
    }
    // The client file holds a secret and is no longer needed once it lives in Worker secrets.
    try { unlinkSync(file); console.log('Deleted the downloaded client file.'); } catch {}
    // List the GA4 properties this account can read, so GA_PROPERTY_ID can be set (IDs are not secret).
    const sums = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', { headers: { authorization: `Bearer ${data.access_token}` } }).then((x) => x.json());
    for (const a of sums.accountSummaries || []) for (const pr of a.propertySummaries || []) console.log(`GA property: ${pr.displayName} = ${pr.property.replace('properties/', '')}`);
    console.log('Google access is set. Set GA_PROPERTY_ID in wrangler.toml, deploy, then reload nwanext.com/admin/stats/.');
  });
});
