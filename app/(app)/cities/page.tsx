import Link from 'next/link';
import { ContentCard } from '@/components/Cards';
import PageHead, { HOME } from '@/components/PageHead';
import { photo } from '@/lib/content';
import { CITY_PHOTO } from '@/lib/cityPhotos';
import { cityStats, openings, items } from '@/lib/data';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Cities and towns, north to south',
  description: 'Every Northwest Arkansas city and town we cover, grouped by county, with events, new spots and local news for each.',
  path: '/cities/',
});

// Group a north-to-south list by county, counties in the order of their northernmost town.
function byCounty<T extends { county: string }>(list: T[]) {
  const map = new Map<string, T[]>();
  for (const c of list) map.set(c.county, [...(map.get(c.county) || []), c]);
  return [...map.entries()];
}

export default function CitiesPage() {
  const all = items();
  const stats = cityStats();
  const live = stats.filter((c) => c.count > 0);
  const quiet = stats.filter((c) => c.count === 0);
  return (
    <div className="page page--cities">
      <PageHead
        trail={[HOME, { name: 'Cities', href: '/cities/' }]}
        title="Cities and towns, north to south"
        lede={`We cover ${stats.length} of them, along I-49 and around it.`}
      />
      <section aria-labelledby="live-title">
        <h2 id="live-title" className="sr-only">Cities with stories</h2>
        <ul className="bgrid">
          {live.map((c) => {
            const p = CITY_PHOTO[c.name] ? photo(CITY_PHOTO[c.name]!) : undefined;
            const mine = all.filter((i) => i.city === c.name);
            const spots = openings(mine).length;
            // No city photo yet: the newest story photo from the town, rather than repeating its name.
            const img = p?.src || mine.find((i) => i.image)?.image;
            return (
              <ContentCard
                key={c.slug}
                href={c.href}
                title={c.name}
                image={img}
                panel={img ? undefined : c.name}
                meta={<p className="meta num"><span>{c.county}</span><span>{c.count} {c.count === 1 ? 'story' : 'stories'}</span>{c.upcoming > 0 && <span>{c.upcoming} coming up</span>}{spots > 0 && <span>{spots} new</span>}</p>}
                text={c.latest ? <>Latest: {c.latest.title}</> : undefined}
              />
            );
          })}
        </ul>
      </section>
      {quiet.length > 0 && (
        <section className="quiet-towns" aria-labelledby="quiet-title">
          <h2 id="quiet-title" className="section-title">More towns we cover</h2>
          <p className="muted">No stories from these yet. <Link className="link" href="/submit/">Send us a tip</Link> and yours could be next.</p>
          <div className="quiet-towns__groups">
            {byCounty(quiet).map(([county, list]) => (
              <div key={county} className="quiet-towns__group">
                <h3 className="quiet-towns__county">{county}</h3>
                <ul className="quiet-towns__list">{list.map((c) => <li key={c.slug}><Link href={c.href}>{c.name}</Link></li>)}</ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
