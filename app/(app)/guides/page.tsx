import Link from 'next/link';
import { ContentCard } from '@/components/Cards';
import PageHead, { HOME } from '@/components/PageHead';
import PairRows from '@/components/PairRows';
import { getResources, slugify } from '@/lib/content';
import { pageMeta } from '@/lib/seo';
import { guidePairs } from '@/lib/site';

export const metadata = pageMeta({
  title: 'Guides and local resources',
  description: 'Starter guides and a directory of Northwest Arkansas city halls, libraries, transit, things to do and ways to volunteer.',
  path: '/guides/',
});

export default function GuidesPage() {
  const { intro, groups } = getResources();
  return (
    <div className="page page--guides">
      <PageHead trail={[HOME, { name: 'Guides', href: '/guides/' }]} title="Guides and resources" lede={intro} />
      <section aria-labelledby="g-title">
        <h2 id="g-title" className="sr-only">Guides</h2>
        <ul className="bgrid">
          {guidePairs().filter((g) => !g.href.endsWith('#directory')).map((g) => (
            <ContentCard key={g.href} href={g.href} title={g.name} text={g.note} className="ccard--panel" />
          ))}
        </ul>
      </section>
      <section className="directory" id="directory" aria-labelledby="d-title">
        <div className="section-head section-head--wrap">
          <h2 id="d-title" className="section-title">Local directory</h2>
          <nav className="anchors" aria-label="Directory sections">
            {groups.map((g) => <a key={g.title} href={`#${slugify(g.title)}`}>{g.title}</a>)}
          </nav>
        </div>
        {groups.map((g) => (
          <section key={g.title} id={slugify(g.title)} className="split dgroup" aria-labelledby={`${slugify(g.title)}-title`}>
            <div className="split__text">
              <h3 id={`${slugify(g.title)}-title`} className="dgroup__title">{g.title}</h3>
              <p className="muted">{g.blurb}</p>
            </div>
            <PairRows className="pairs--grid" items={g.links.map((l) => ({ href: l.url, name: l.name, note: l.note || l.city, external: true }))} />
          </section>
        ))}
        <p className="note-line">Missing something useful? <Link className="link" href="/submit/">Suggest a link.</Link></p>
      </section>
    </div>
  );
}
