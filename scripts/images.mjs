// Makes phone-sized copies of the story and place photos from media/ (the originals).
// WebP at several widths plus one 1200px JPEG for Open Graph, the feed and JSON-LD.
// Idempotent: skips outputs newer than their source and never deletes anything.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = ROOT;
const OUT = path.join(ROOT, 'public');
const WIDTHS = [240, 480, 800, 1200, 1600];
const fresh = (out, src) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;

const manifest = {};
let made = 0;

for (const folder of ['posts', 'places']) {
  const inDir = path.join(SRC, 'media', folder);
  const outDir = path.join(OUT, 'media', folder);
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(inDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  for (const file of files) {
    const src = path.join(inDir, file);
    const name = file.replace(/\.[^.]+$/, '');
    const meta = await sharp(src).rotate().metadata();
    const w = meta.autoOrient?.width ?? meta.width;
    const h = meta.autoOrient?.height ?? meta.height;
    const widths = WIDTHS.filter((x) => x <= w);
    if (!widths.length) widths.push(w);
    for (const width of widths) {
      const out = path.join(outDir, `${name}-${width}.webp`);
      if (fresh(out, src)) continue;
      await sharp(src).rotate().resize({ width }).webp({ quality: 72 }).toFile(out);
      made++;
    }
    const jpg = path.join(outDir, `${name}.jpg`);
    if (!fresh(jpg, src)) {
      await sharp(src).rotate().resize({ width: Math.min(1200, w) }).jpeg({ quality: 78, mozjpeg: true }).toFile(jpg);
      made++;
    }
    manifest[`/media/${folder}/${file}`] = { w, h, widths };
  }
}

fs.writeFileSync(path.join(ROOT, 'lib', 'media.json'), JSON.stringify(manifest, null, 1) + '\n');

console.log(`images: ${Object.keys(manifest).length} sources, ${made} files written`);
