import { ContentCard } from '@/components/Cards';
import PageHead, { HOME } from '@/components/PageHead';
import { itemsForPlace, placeStats } from '@/lib/data';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Places we cover often',
  description: 'The Northwest Arkansas venues that keep coming up: The Momentary, Walton Arts Center, Bentonville Square and more, with their events and news.',
  path: '/places/',
});

export default function PlacesPage() {
  return (
    <div className="page page--places">
      <PageHead trail={[HOME, { name: 'Places', href: '/places/' }]} title="Places we cover often" lede="Venues that keep turning up in our stories." />
      <ul className="bgrid">
        {placeStats().map((p) => {
          // The photo from the newest story at this place (story photos credit on their own pages).
          const img = itemsForPlace(p.slug).find((i) => i.image);
          return (
            <ContentCard
              key={p.slug}
              href={p.href}
              title={p.name}
              image={img?.image}
              panel={img ? undefined : p.name}
              meta={<p className="meta num"><span>{p.city}</span><span>{p.count} stories</span>{p.upcoming > 0 && <span>{p.upcoming} coming up</span>}</p>}
              text={p.blurb}
            />
          );
        })}
      </ul>
    </div>
  );
}
