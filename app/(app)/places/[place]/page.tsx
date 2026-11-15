import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PageHead, { HOME } from '@/components/PageHead';
import Browse from '@/components/Browse';
import { getCities } from '@/lib/content';
import { cityHref, itemsForPlace, placeStats, upcoming } from '@/lib/data';
import { itemListLd, pageMeta } from '@/lib/seo';
import { browseBase, cards } from '@/lib/view';

export const dynamicParams = false;
export const generateStaticParams = () => placeStats().map((p) => ({ place: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ place: string }> }) {
  const { place } = await params;
  const p = placeStats().find((x) => x.slug === place);
  if (!p) return {};
  return pageMeta({ title: `${p.name} in ${p.city}: events and news`, description: `${p.blurb} What is coming up at ${p.name} and what we covered before.`, path: p.href });
}

export default async function PlacePage({ params }: { params: Promise<{ place: string }> }) {
  const { place } = await params;
  const p = placeStats().find((x) => x.slug === place);
  if (!p) notFound();
  const all = itemsForPlace(p.slug);
  const up = upcoming(all);
  const { ctx, topics } = browseBase();
  const cities = getCities();
  const others = placeStats().filter((x) => x.slug !== p.slug);
  const cHref = cityHref(p.city);
  return (
    <div className="page page--place">
      <Browse
        variant="home"
        list={cards(all)}
        facets={['show', 'topic', 'when', 'free']}
        fixed={[{ facet: 'city', label: p.name }]}
        lock={{ city: cities.find((c) => c.name === p.city)?.slug || '' }}
        topics={topics}
        ctx={ctx}
        showCity={false}
        modules={false}
        viewSwitch
        label={`Stories about ${p.name}`}
        carouselTitle={`Coming up at ${p.name}`}
        head={
          <PageHead trail={[HOME, { name: 'Places', href: '/places/' }, { name: p.name, href: p.href }]} title={p.name} lede={p.blurb}>
            <p className="meta"><span>{cHref ? <Link href={cHref}>{p.city}</Link> : p.city}</span><span className="num">{p.count} stories</span>{up.length > 0 && <span className="num">{up.length} coming up</span>}</p>
          </PageHead>
        }
      />
      {others.length > 0 && (
        <nav className="hub-section" aria-labelledby="other-places">
          <h2 id="other-places" className="section-title">Other places</h2>
          <ul className="pairs pairs--compact pairs--grid">
            {others.map((o) => <li key={o.slug} className="pair"><Link className="pair__link" href={o.href}>{o.name}</Link><span className="pair__note">{o.city}, {o.count} stories</span></li>)}
          </ul>
        </nav>
      )}
      <JsonLd data={itemListLd(`${p.name} in ${p.city}: events and news`, all)} />
    </div>
  );
}
