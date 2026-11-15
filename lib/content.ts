import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { NOW } from './now';

// Content lives in this repo (`content/`), edited in the CMS at /admin. Read-only from here.
const CONTENT = path.join(process.cwd(), 'content');
const C = (...p: string[]) => path.join(CONTENT, ...p);

export type Source = { name: string; url?: string };
export type Article = {
  slug: string;
  title: string;
  date: string;
  city: string;
  category: string;
  status: '' | 'opening' | 'closing' | 'building' | 'changing';
  summary: string;
  eventDate?: string;
  instagram?: string;
  instagramAlso?: string;
  format: 'post' | 'reel';
  image?: string;
  graphic?: string;
  imageAlt?: string;
  showImage: boolean;
  credits: string[];
  sources: Source[];
  tags: string[];
  featured: boolean;
  free: boolean;
  html: string;
  text: string;
};

export type City = { slug: string; name: string; county: string; intro: string; lat: number; lon: number; featured: boolean };
export type Guide = { slug: string; title: string; summary: string; order: number; html: string };
export type ResourceLink = { name: string; url: string; city?: string; note?: string };
export type ResourceGroup = { title: string; blurb: string; links: ResourceLink[] };

export type Site = {
  name: string;
  url: string;
  tagline: string;
  description: string;
  instagram: string;
  instagramHandle: string;
  newsletter: { name: string; pitch: string; provider: string; action: string; emailField: string };
  tips: { action: string; pitch: string };
};

const readJson = <T,>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8')) as T;

export const getSite = (): Site => readJson<Site>(C('site.json'));
// Every city and town in the CMS, north to south. `featured` (default true) puts a city in the scope row
// and the nav; the rest are one tap away in "More towns". NWA_CITIES_FILE swaps the file for testing.
export const getCities = (): City[] =>
  readJson<(Omit<City, 'featured'> & { featured?: boolean })[]>(process.env.NWA_CITIES_FILE || C('cities.json'))
    .map((c) => ({ ...c, featured: c.featured !== false }))
    .sort((a, b) => b.lat - a.lat);
export const getResources = () => readJson<{ intro: string; groups: ResourceGroup[] }>(C('resources.json'));

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const HANDLES = (() => { try { return JSON.parse(fs.readFileSync(C('handles.json'), 'utf8')) as Record<string, string>; } catch { return {}; } })();
const plain = (md: string) => md.replace(/\[@([^\]]+)\]\([^)]+\)/g, (_, h: string) => HANDLES[h.toLowerCase()] || h).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_#>`]/g, '').replace(/\s+/g, ' ').trim();
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

// The caption usually opens with the headline. Don't repeat it as the summary.
function cleanSummary(title: string, summary: string, body: string) {
  const t = norm(title);
  const paras = body.split(/\n\s*\n/).map(plain).filter(Boolean);
  const candidates = [plain(summary), ...paras];
  for (const c of candidates) {
    let rest = c;
    if (norm(c).startsWith(t.slice(0, Math.max(12, Math.floor(t.length * 0.8))))) {
      const m = c.match(/^.+?[.!?](\s+|$)(?=[A-Z“"]|$)/);
      rest = m ? c.slice(m[0].length).trim() : '';
    }
    if (rest.length > 30) return rest.length > 200 ? rest.slice(0, rest.lastIndexOf(' ', 200)).replace(/[,;:]$/, '') + '…' : rest;
  }
  return '';
}

// Captions open with the headline. On the site the headline is the h1, so drop that first sentence from the body.
function dropLeadSentence(title: string, md: string) {
  const t = norm(title);
  const [first, ...rest] = md.split(/\n\s*\n/);
  if (!first || !norm(plain(first)).startsWith(t.slice(0, Math.max(12, Math.floor(t.length * 0.8))))) return md;
  const m = first.match(/^.+?[.!?](\s+|$)(?=[A-Z“"\[]|$)/s);
  const remainder = m ? first.slice(m[0].length).trim() : '';
  return [remainder, ...rest].filter(Boolean).join('\n\n');
}

// Bare domains in captions ("Details: gusanos.pizza/menu") become links.
function linkify(md: string) {
  return md.replace(/(^|[\s:])((?:[a-z0-9-]+\.)+(?:com|org|net|pizza|gov|edu|us|co|io|art|events|coffee)(?:\/[^\s)\]]*)?)(?=[\s.,;]|$)/gim, (m, pre, url) => `${pre}[${url}](https://${url.replace(/[.,;]$/, '')})`);
}

export type StoryLite = Pick<Article, 'slug' | 'title' | 'city' | 'category' | 'status' | 'date' | 'summary' | 'free' | 'eventDate'> & { image?: string; credit?: string };
export const lite = (a: Article): StoryLite => ({
  slug: a.slug, title: a.title, city: a.city, category: a.category, status: a.status, date: a.date, summary: a.summary, free: a.free, eventDate: a.eventDate,
  image: a.showImage ? a.image : undefined, credit: a.showImage ? shortCredit(a.credits) : undefined,
});

// "Photo: Kathy Tran / The Momentary. Logo: The Momentary." -> "Kathy Tran / The Momentary"
export function shortCredit(credits: string[]) {
  const c = credits.find((x) => !/^logo/i.test(x)) || credits[0];
  if (!c) return undefined;
  return c.replace(/^(Photos?|Images?|Artwork|Poster|Photo and logo|Photo\/video)\s*:\s*/i, '').replace(/^Photo by\s*/i, '').replace(/\.\s*Logo:.*$/i, '').replace(/[.]$/, '').trim();
}

export type Photo = { slug: string; src: string; width: number; height: number; city: string; caption: string; author: string; license: string; license_url: string; source: string; title: string };
export const getPhotos = (): Photo[] => readJson<Photo[]>(C('photos.json'));
export const photo = (slug: string) => getPhotos().find((p) => p.slug === slug);
export const photoCredit = (p: Photo) => `${p.author}, ${p.license}`;

let cache: Article[] | null = null;
export function getArticles(): Article[] {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const dir = C('articles');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  const seen = new Set<string>();
  const list = files.map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
    let slug = f.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    if (seen.has(slug)) slug = f.replace(/\.md$/, '');
    seen.add(slug);
    const text = content.trim();
    const bodyMd = linkify(dropLeadSentence(String(data.title || ''), text));
    const hay = `${data.title} ${text}`.toLowerCase();
    return {
      slug,
      title: String(data.title || 'Untitled'),
      date: new Date(data.date || Date.now()).toISOString(),
      city: String(data.city || 'Northwest Arkansas'),
      category: String(data.category || 'News'),
      status: (data.status || '') as Article['status'],
      summary: cleanSummary(String(data.title || ''), String(data.summary || ''), text),
      eventDate: data.event_date ? String(data.event_date) : undefined,
      instagram: data.instagram || undefined,
      instagramAlso: data.instagram_also || undefined,
      format: data.format === 'reel' ? 'reel' : 'post',
      image: data.image || undefined,
      graphic: data.graphic || undefined,
      imageAlt: data.image_alt || '',
      // Sam, 2026-11-01: sourced images show with a small credit unless hidden in the CMS.
      showImage: data.show_image !== false && !!data.image,
      credits: Array.isArray(data.credits) ? data.credits : [],
      sources: Array.isArray(data.sources) ? data.sources : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      featured: data.featured === true,
      free: data.free === true || /\bfree\b/.test(hay),
      html: marked.parse(bodyMd, { async: false }) as string,
      text,
    } satisfies Article;
  });
  // Stories dated after "now" are left out, so NWA_NOW previews the site as it was on that day.
  const visible = list.filter((a) => new Date(a.date) <= NOW);
  visible.sort((a, b) => (a.date < b.date ? 1 : -1));
  cache = visible;
  return visible;
}

export const getArticle = (slug: string) => getArticles().find((a) => a.slug === slug);

export function getLead(articles = getArticles()) {
  return articles.find((a) => a.featured) || articles[0];
}

export function getGuides(): Guide[] {
  const dir = C('guides');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return {
        slug: f.replace(/\.md$/, ''),
        title: String(data.title),
        summary: String(data.summary || ''),
        order: Number(data.order || 99),
        html: marked.parse(content, { async: false }) as string,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export const STATUS_WORDS = ['opening', 'closing', 'building', 'changing'] as const;

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/Chicago', ...opts });
}

export function citySlug(name: string) {
  return getCities().find((c) => c.name === name)?.slug;
}

export const absoluteUrl = (p: string) => new URL(p, getSite().url).toString();

// What client components get for each story: the lite shape plus the photo's real size.
import media from './media.json';
export type MediaInfo = { w: number; h: number; widths: number[] };
export const mediaInfo = (src?: string) => (src ? (media as Record<string, MediaInfo>)[src] : undefined);
export type Story = StoryLite & { w?: number; h?: number };
export const story = (a: Article): Story => {
  const s = lite(a);
  const m = mediaInfo(s.image);
  return m ? { ...s, w: m.w, h: m.h } : s;
};
