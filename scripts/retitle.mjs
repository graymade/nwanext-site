// After the editing step has written a proper headline, give the story a web address that matches it.
// Run from _Pocket:  node scripts/retitle.mjs content/articles/<file>.md [...]
// Renames <date>-<slug>.md to the slug of its current title (and its imported picture to match), and clears needs_edit.
// Only for stories that are not live yet: a published address never changes (old links would break).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTICLES = path.join(ROOT, 'content/articles'), MEDIA = path.join(ROOT, 'media/posts');
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/^(.{0,72})(-.*)?$/, (m, a, b) => (b && a.length > 30 ? a : m.slice(0, 72))).replace(/-(in|on|at|to|for|with|and|the|a|of)$/, '');
// whole words only, about 72 characters at most

for (const arg of process.argv.slice(2)) {
  const file = path.resolve(ROOT, arg.includes('/') ? arg : `content/articles/${arg}`);
  if (!fs.existsSync(file)) { console.log(`  ! missing ${arg}`); continue; }
  const g = matter(fs.readFileSync(file, 'utf8'));
  const date = path.basename(file).slice(0, 10);
  let slug = slugify(String(g.data.title || ''));
  if (!slug) { console.log(`  ! no title ${arg}`); continue; }
  let name = `${date}-${slug}.md`;
  if (name !== path.basename(file) && fs.existsSync(path.join(ARTICLES, name))) name = `${date}-${slug}-2.md`;
  // the imported picture follows the story's new name
  const img = String(g.data.image || '');
  if (img.startsWith('/media/posts/') && img.endsWith('.jpg')) {
    const from = path.join(MEDIA, path.basename(img)), to = path.join(MEDIA, `${name.slice(11, -3)}.jpg`);
    if (fs.existsSync(from) && from !== to) { fs.renameSync(from, to); }
    if (fs.existsSync(to)) { g.data.image = `/media/posts/${path.basename(to)}`; if (g.data.graphic === img) g.data.graphic = g.data.image; }
  }
  delete g.data.needs_edit;
  fs.writeFileSync(file, matter.stringify(g.content, g.data));
  if (name !== path.basename(file)) fs.renameSync(file, path.join(ARTICLES, name));
  console.log(`  ${path.basename(file)} -> ${name}`);
}
