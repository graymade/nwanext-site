import Link from 'next/link';
import Icon from '@/components/Icon';
import Wordmark from '@/components/Wordmark';
import { Row } from '@/components/Rows';
import { getSite } from '@/lib/content';
import { items, upcoming } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import { cards } from '@/lib/view';

export const metadata = pageMeta({
  title: 'Links',
  description: 'NWA Next: this week in Northwest Arkansas, new spots, the latest stories and the Friday email.',
  path: '/links/',
  noindex: true,
});

// The Instagram bio page (Relume links 1). Phone first, no app chrome.
export default function LinksPage() {
  const site = getSite();
  const up = upcoming().length;
  return (
    <main id="main" className="links-page">
      <div className="section_links1">
        <header className="links__head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="links__avatar" src="/brand/nwa-next-avatar.png" alt="" width={96} height={96} suppressHydrationWarning />
          <h1 className="links__name"><Wordmark className="links__mark" /></h1>
          <p className="links__line">{site.tagline}</p>
        </header>
        <nav className="links__list" aria-label="NWA Next links">
          <Link className="links__btn links__btn--primary" href="/events/"><span>This week in NWA{up ? `, ${up} coming up` : ''}</span><Icon name="right" /></Link>
          <Link className="links__btn" href="/openings/"><span>New spots</span><Icon name="right" /></Link>
          <section className="links__latest" aria-labelledby="latest-title">
            <h2 id="latest-title">Latest</h2>
            <ul className="rows">{cards(items().slice(0, 3)).map((c) => <Row key={c.slug} c={c} />)}</ul>
          </section>
          <Link className="links__btn" href="/newsletter/"><span>Get the Friday email</span><Icon name="right" /></Link>
          <Link className="links__btn" href="/submit/"><span>Send us a tip</span><Icon name="right" /></Link>
          <a className="links__btn" href={site.instagram}><span>Follow on Instagram</span><Icon name="right" /></a>
        </nav>
        <p className="links__foot"><Link href="/">nwanext.com</Link></p>
      </div>
    </main>
  );
}
