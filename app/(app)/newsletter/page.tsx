import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import { StoryTile } from '@/components/Cards';
import { Breadcrumbs, HOME } from '@/components/PageHead';
import { getSite } from '@/lib/content';
import { items } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import { cards } from '@/lib/view';

export const metadata = pageMeta({
  title: 'Newsletter',
  description: 'The free NWA Next newsletter: new openings, things to do and what’s changing across Northwest Arkansas.',
  path: '/newsletter/',
});

export default function NewsletterPage() {
  const site = getSite();
  return (
    <div className="page page--newsletter">
      <header className="page-head form-head section_cta14">
        <Breadcrumbs trail={[HOME, { name: 'Newsletter', href: '/newsletter/' }]} />
        <div className="form-head__grid">
          <div className="form-head__text">
            <h1 className="page-title">Get the NWA Next newsletter.</h1>
            <p className="lede">{site.newsletter.pitch}</p>
          </div>
          <div className="form-card">
            <NewsletterForm action={site.newsletter.action} emailField={site.newsletter.emailField} handle={site.instagramHandle} stacked />
          </div>
        </div>
      </header>
      <section className="hub-section" aria-labelledby="recent-title">
        <div className="section-head">
          <h2 id="recent-title" className="section-title">Recent stories</h2>
          <Link className="see-all" href="/news/">All stories</Link>
        </div>
        <ul className="tiles">{cards(items().slice(0, 4)).map((c) => <StoryTile key={c.slug} c={c} />)}</ul>
      </section>
    </div>
  );
}
