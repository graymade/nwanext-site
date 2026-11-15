// Page metadata and structured data, so every page has a clear title, a canonical URL and the right schema.
import type { Metadata } from 'next';
import { absoluteUrl, getSite, mediaInfo, type Article } from './content';
import type { Facts } from './facts';
import type { Item } from './data';

const site = () => getSite();
const ogImage = (src?: string) => (src && mediaInfo(src) ? src : undefined);

// One call per page: title, description, canonical, Open Graph. Thin pages pass noindex.
export function pageMeta({ title, description, path, image, noindex, type = 'website' }: { title: string; description: string; path: string; image?: string; noindex?: boolean; type?: 'website' | 'article' }): Metadata {
  const img = ogImage(image);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type, title, description, url: path, siteName: site().name, images: img ? [{ url: img, width: 1200 }] : [{ url: '/open-graph-share.png', width: 1200, height: 630, alt: 'NWA Next' }] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export type Crumb = { name: string; href: string };
export const breadcrumbLd = (crumbs: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absoluteUrl(c.href) })),
});

export const orgLd = () => {
  const s = site();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'NewsMediaOrganization', '@id': `${s.url}/#org`, name: s.name, url: s.url, logo: `${s.url}/brand/nwa-next-avatar.png`, sameAs: [s.instagram], areaServed: 'Northwest Arkansas' },
      {
        '@type': 'WebSite',
        '@id': `${s.url}/#site`,
        name: s.name,
        url: s.url,
        publisher: { '@id': `${s.url}/#org` },
        potentialAction: { '@type': 'SearchAction', target: `${s.url}/search/?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
      },
    ],
  };
};

// Central time offset on that day: -05:00 in summer, -06:00 in winter.
function chicagoOffset(key: string) {
  const name = new Date(`${key}T12:00:00Z`).toLocaleString('en-US', { timeZone: 'America/Chicago', timeZoneName: 'shortOffset' });
  const h = Number(name.match(/GMT([+-]\d+)/)?.[1] ?? -6);
  return `${h < 0 ? '-' : '+'}${String(Math.abs(h)).padStart(2, '0')}:00`;
}
const iso = (key: string, time?: string) => (time ? `${key}T${time}:00${chicagoOffset(key)}` : key);

// A story about an event also gets Event schema, so it can show in Google's event listings.
export function eventLd(a: Pick<Article, 'title' | 'summary' | 'city' | 'image' | 'showImage' | 'slug'>, f: Facts) {
  if (f.kind !== 'event' || !f.start) return undefined;
  const img = a.showImage ? ogImage(a.image) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: a.title,
    description: a.summary || undefined,
    startDate: iso(f.start, f.startTime),
    endDate: f.end ? iso(f.end, f.endTime) : f.endTime ? iso(f.start, f.endTime) : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: f.place?.name || a.city,
      address: { '@type': 'PostalAddress', ...(f.address ? { streetAddress: f.address } : {}), addressLocality: f.place?.city || a.city, addressRegion: 'AR', addressCountry: 'US' },
    },
    isAccessibleForFree: f.price === 'Free' || undefined,
    ...(f.price && f.price !== 'Free' ? { offers: { '@type': 'Offer', price: f.price.replace('$', ''), priceCurrency: 'USD', url: absoluteUrl(`/news/${a.slug}/`) } } : {}),
    ...(img ? { image: [absoluteUrl(img)] } : {}),
    url: absoluteUrl(`/news/${a.slug}/`),
  };
}

export function articleLd(a: Article, f: Facts) {
  const s = site();
  const img = a.showImage ? ogImage(a.image) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description: a.summary || undefined,
    datePublished: a.date,
    dateModified: a.date,
    articleSection: a.category,
    ...(img ? { image: [absoluteUrl(img)] } : {}),
    author: { '@id': `${s.url}/#org` },
    publisher: { '@id': `${s.url}/#org` },
    mainEntityOfPage: absoluteUrl(`/news/${a.slug}/`),
    contentLocation: { '@type': 'Place', name: f.place?.name || `${a.city}, Arkansas` },
  };
}

// A list page (events, a city, a topic) as an ordered list of its stories.
export const itemListLd = (name: string, list: Item[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  itemListElement: list.slice(0, 30).map((i, n) => ({ '@type': 'ListItem', position: n + 1, url: absoluteUrl(i.href), name: i.title })),
});
