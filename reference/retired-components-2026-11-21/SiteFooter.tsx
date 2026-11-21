// The HTML sitemap at the bottom of the main column: every hub in one compact block.
import Link from 'next/link';
import Wordmark from './Wordmark';
import { getSite } from '@/lib/content';
import { cityStats, placeStats, topicStats } from '@/lib/data';
import { TODAY as TODAY_ISO } from '@/lib/now';

export default function SiteFooter() {
  const site = getSite();
  const cols = [
    { title: 'Cities', links: [...cityStats().filter((c) => c.featured).map((c) => ({ href: c.href, name: c.name })), { href: '/cities/', name: 'All cities and towns' }] },
    { title: 'Topics', links: topicStats().filter((t) => t.count > 0 && t.slug !== 'events').map((t) => ({ href: t.href, name: t.h1 })) },
    {
      title: 'Things to do',
      links: [
        { href: '/events/', name: 'Things to do' },
        { href: '/calendar/', name: 'Calendar' },
        { href: '/guides/free-things-to-do/', name: 'Free things to do' },
        ...placeStats().map((p) => ({ href: p.href, name: p.name })),
        { href: '/places/', name: 'All places' },
      ],
    },
    {
      title: 'New spots',
      links: [
        { href: '/openings/', name: 'Now open' },
        { href: '/openings/#coming', name: 'Coming soon' },
        { href: '/news/', name: 'All stories' },
        { href: '/guides/', name: 'Guides' },
      ],
    },
    {
      title: 'NWA Next',
      links: [
        { href: '/about/', name: 'About' },
        { href: '/connect/', name: 'Get connected' },
        { href: '/newsletter/', name: 'Newsletter' },
        { href: '/submit/', name: 'Send a tip' },
        { href: '/credits/', name: 'Photo credits' },
        { href: '/feed.xml', name: 'RSS feed' },
        { href: site.instagram, name: 'Instagram' },
      ],
    },
  ];
  return (
    <footer className="sitemap" id="sitemap">
      <h2 className="sr-only">Site map</h2>
      <div className="sitemap__top">
        <div className="sitemap__brand">
          <Link href="/" className="sitemap__mark" aria-label="NWA Next, home"><Wordmark /></Link>
          <p className="sitemap__tagline">{site.tagline}</p>
          <p>Every story links to its sources. See something wrong? <Link className="link" href="/submit/">Tell us.</Link></p>
        </div>
        <div className="sitemap__cols">
          {cols.map((c) => (
            <div key={c.title} className="sitemap__col">
              <h3 className="sitemap__h">{c.title}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l.href}>{l.href.startsWith('/') && !l.href.endsWith('.xml') ? <Link href={l.href}>{l.name}</Link> : <a href={l.href}>{l.name}</a>}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="sitemap__base">© {new Date(TODAY_ISO).getUTCFullYear()} NWA Next</p>
    </footer>
  );
}
