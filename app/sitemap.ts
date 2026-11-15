import type { MetadataRoute } from 'next';
import { absoluteUrl, getArticles, getGuides } from '@/lib/content';
import { cityStats, placeStats, topicStats } from '@/lib/data';

export const dynamic = 'force-static';

// Every hub page plus every story. Topic pages with fewer than three stories are noindex, so they stay out.
export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles();
  const latest = articles[0]?.date;
  const page = (p: string, priority = 0.6) => ({ url: absoluteUrl(p), lastModified: latest, priority });
  return [
    page('/', 1),
    page('/events/', 0.9),
    page('/calendar/', 0.8),
    page('/openings/', 0.9),
    page('/news/', 0.8),
    page('/cities/', 0.7),
    // Towns with no stories yet are noindex, so they stay out until the first story lands.
    ...cityStats().filter((c) => c.count > 0).map((c) => page(c.href, 0.8)),
    ...topicStats().filter((t) => t.slug !== 'events' && t.count >= 3).map((t) => page(t.href, 0.7)),
    ...placeStats().map((p) => page(p.href, 0.7)),
    page('/guides/', 0.7),
    page('/guides/free-things-to-do/', 0.8),
    ...getGuides().map((g) => page(`/guides/${g.slug}/`, 0.6)),
    page('/connect/', 0.5),
    page('/newsletter/', 0.5),
    page('/about/', 0.4),
    page('/submit/', 0.4),
    page('/credits/', 0.2),
    ...articles.map((a) => ({ url: absoluteUrl(`/news/${a.slug}/`), lastModified: a.date, priority: 0.7 })),
  ];
}
