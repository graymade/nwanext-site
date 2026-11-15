import Link from 'next/link';
import PageHead, { HOME } from '@/components/PageHead';
import { getCities, getSite } from '@/lib/content';
import { comingSoon, items, openings } from '@/lib/data';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'About',
  description: 'How NWA Next covers Northwest Arkansas: what we cover, how we check stories and how to reach us.',
  path: '/about/',
});

// "Bentonville, Rogers and Springdale, and the towns around them." Built from the CMS city list.
function whereWeCover() {
  const f = getCities().filter((c) => c.featured).map((c) => c.name);
  const list = f.length > 1 ? `${f.slice(0, -1).join(', ')} and ${f.at(-1)}` : f[0] || 'Northwest Arkansas';
  return getCities().length > f.length ? `${list}, plus the towns around them.` : `${list}.`;
}

// The standards, each a short name for the sentence under it.
const CHECKS = [
  ['First-hand sources', 'Every story is confirmed with a first-hand source, like the business, the venue, the organizer or the city.'],
  ['Sources on every story', 'Every story lists its sources, and we credit photos.'],
  ['Details rechecked', 'Dates, times and prices are rechecked before we post.'],
  ['No rumors', 'We don’t run rumors. If a closing isn’t confirmed, it isn’t a story yet.'],
];

export default function AboutPage() {
  const site = getSite();
  const all = items();
  // Counts straight from the stories on the site, so they stay true as stories are added.
  const stats = [
    [all.length, all.length === 1 ? 'story' : 'stories'],
    [all.filter((i) => i.facts.kind === 'event').length, 'events covered'],
    [openings().length + comingSoon().length, 'new spots tracked'],
    [getCities().length, 'cities and towns'],
  ] as const;
  return (
    <article className="page page--about">
      <PageHead
        trail={[HOME, { name: 'About', href: '/about/' }]}
        title="About NWA Next"
        lede="NWA Next tracks what’s opening, closing, building and changing across Northwest Arkansas, so you hear about the new taco place, the festival and the thing going up on your street before everyone else does."
      />

      <section className="split section_stats14" aria-labelledby="cover-title">
        <div className="split__text">
          <h2 id="cover-title" className="section-title">What we cover</h2>
          <p className="body-text">{whereWeCover()} Mostly new restaurants and shops, local events worth making plans around, and development that changes how people live and get around.</p>
          <p className="actions"><Link className="button button--quiet" href="/cities/">Every city and town</Link></p>
        </div>
        <dl className="figures">
          {stats.map(([n, label]) => (
            <div key={label} className="figure">
              <dt>{label}</dt>
              <dd className="num">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="checks" aria-labelledby="check-title">
        <h2 id="check-title" className="section-title">How we check stories</h2>
        <ol className="checks__list">
          {CHECKS.map(([name, line], i) => (
            <li key={name} className="check">
              <span className="check__n num" aria-hidden="true">{i + 1}</span>
              <h3 className="check__name">{name}</h3>
              <p>{line}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="panels">
        <section className="panel" id="corrections" aria-labelledby="fix-title">
          <h2 id="fix-title" className="section-title">Corrections</h2>
          <p>If we get something wrong, we fix it and say so.</p>
          <p className="actions">
            <Link className="button" href="/submit/">Tell us</Link>
            <a className="link" href={site.instagram}>Message @{site.instagramHandle}</a>
          </p>
        </section>
        <section className="panel" aria-labelledby="tips-title">
          <h2 id="tips-title" className="section-title">Tips</h2>
          <p>Most of our best stories start with a reader.</p>
          <p className="actions"><Link className="button button--quiet" href="/submit/">Send a tip</Link></p>
        </section>
      </div>
    </article>
  );
}
