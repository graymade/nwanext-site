// Keeps nwanext.com in step with the @nwa_next Instagram feed. Every post on the account becomes a website story, whoever
// published it (Muse, Sam in the app, anything else). Reads Instagram's public profile embed (the six newest posts, no login,
// no token), imports any post not on the site yet (scripts/import-instagram.mjs), then the editing step and the deploy follow.
// Run from _Pocket:  node scripts/sync-instagram.mjs [--dry-run | --check]     (npm run ig:sync)
// Prints the new article files, one per line after "NEW:", so a wrapper can hand them to the editing step.
import { importPosts } from './import-instagram.mjs';

const DRY = process.argv.includes('--dry-run');
const USER = 'nwa_next';

export async function recentPosts(user = USER) {
  const res = await fetch(`https://www.instagram.com/${user}/embed/`, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`profile embed answered ${res.status}`);
  const html = await res.text();
  // The page carries its data as a JSON string inside a JSON object: "contextJSON":"{\"context\":...}"
  const key = '"contextJSON":"', at = html.indexOf(key);
  if (at < 0) throw new Error('profile embed changed: no contextJSON');
  let i = at + key.length, lit = '';
  for (; i < html.length; i++) { const c = html[i]; if (c === '\\') { lit += c + html[++i]; continue; } if (c === '"') break; lit += c; }
  const ctx = JSON.parse(JSON.parse(`"${lit}"`));
  const media = ctx.context?.graphql_media || [];
  return media.map(({ shortcode_media: m }) => ({
    code: m.shortcode,
    date: new Date(m.taken_at_timestamp * 1000).toISOString(),
    caption: m.edge_media_to_caption?.edges?.[0]?.node?.text || '',
    alt: m.accessibility_caption || '',
    video: !!m.is_video,
  }));
}

const posts = await recentPosts();
// --check: exit 0 when the feed has a post the site doesn't (so the hourly job should run), 1 when there's nothing new.
if (process.argv.includes('--check')) {
  const { existingCodes } = await import('./import-instagram.mjs');
  const fresh = posts.filter((p) => !existingCodes().has(p.code));
  console.log(fresh.length ? `New on Instagram: ${fresh.map((p) => p.code).join(' ')}` : 'Nothing new on Instagram.');
  process.exit(fresh.length ? 0 : 1);
}
console.log(`Instagram feed: ${posts.length} newest posts read (${posts[0]?.date || 'none'} newest).`);
const added = await importPosts(posts, { dry: DRY });
if (added.length) console.log(`NEW:\n${added.join('\n')}`);
