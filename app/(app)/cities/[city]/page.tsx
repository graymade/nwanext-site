import Link from 'next/link';
import { notFound } from 'next/navigation';
import Browse from '@/components/Browse';
import Img from '@/components/Img';
import JsonLd from '@/components/JsonLd';
import MakeMyCity from '@/components/MakeMyCity';
import PairRows from '@/components/PairRows';
import { Breadcrumbs, HOME } from '@/components/PageHead';
import { getCities, getResources, photo, shortCredit } from '@/lib/content';
import { CITY_PHOTO } from '@/lib/cityPhotos';
import { comingSoon, items, openings, upcoming } from '@/lib/data';
import { itemListLd, pageMeta } from '@/lib/seo';
import { browseBase, cards } from '@/lib/view';

export const dynamicParams = false;
export const generateStaticParams = () => getCities().map((c) => ({ city: c.slug }));

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const c = getCities().find((x) => x.slug === city);
  if (!c) return {};
  return pageMeta({
    title: `Things to do and what’s new in ${c.name}, AR`,
    description: `Events, new restaurants and shops, and what is changing in ${c.name}, Arkansas. ${c.intro}`,
    path: `/cities/${c.slug}/`,
    image: CITY_PHOTO[c.name] ? photo(CITY_PHOTO[c.name]!)?.src : undefined,
    // A town with no stories yet is a thin page: keep it out of search until the first story lands.
    noindex: !items().some((i) => i.city === c.name),
  });
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const c = getCities().find((x) => x.slug === city);
  if (!c) notFound();
  const mine = items().filter((i) => i.city === c.name);
  const up = upcoming(mine);
  const spots = [...openings(mine), ...comingSoon(mine)];
  const links = getResources().groups.flatMap((g) => g.links.filter((l) => l.city === c.name).map((l) => ({ href: l.url, name: l.name, note: g.title, external: true })));
  const pSlug = CITY_PHOTO[c.name];
  const p = pSlug ? photo(pSlug) : undefined;
  const near = getCities().filter((x) => x.slug !== c.slug && x.county === c.county);
  const others = (near.length ? near : getCities().filter((x) => x.slug !== c.slug)).slice(0, 8);
  const quiet = mine.length === 0;
  const { ctx, topics } = browseBase();
  // A town with no stories yet: the empty state sits beside the header when there is no photo to show.
  const quietPanel = (
    <section className="quiet" aria-labelledby="quiet-title">
      <h2 id="quiet-title" className="quiet__line">No stories from {c.name} yet.</h2>
      <p className="muted">We are just starting to cover {c.name}. If something is opening, closing or happening here, tell us and we will check it out.</p>
      <p className="quiet__actions">
        <Link className="button" href="/submit/">Send a tip about {c.name}</Link>
        <Link className="button button--quiet" href="/calendar/">See what is on across NWA</Link>
      </p>
    </section>
  );

  return (
    <div className="page page--city">
      <header className="page-head city-head">
        <Breadcrumbs trail={[HOME, { name: 'Cities', href: '/cities/' }, { name: c.name, href: `/cities/${c.slug}/` }]} />
        <div className="city-head__split">
          <div className="city-head__text">
            <h1 className="page-title">{c.name}</h1>
            <p className="city-head__county">{c.county}</p>
            <p className="lede">{c.intro}</p>
            {!quiet && (
              <p className="stats num">
                <span><strong>{mine.length}</strong> {mine.length === 1 ? 'story' : 'stories'}</span>
                <span><strong>{up.length}</strong> coming up</span>
                <span><strong>{openings(mine).length}</strong> new {openings(mine).length === 1 ? 'spot' : 'spots'}</span>
              </p>
            )}
            <p className="city-head__actions">
              <MakeMyCity slug={c.slug} name={c.name} />
              <a className="link" href="#links">{c.name} links</a>
            </p>
          </div>
          {p ? (
            <figure className="city-head__photo">
              <span className="frame"><Img src={p.src} alt={p.caption} sizes="(max-width: 1024px) 100vw, 40rem" priority /></span>
              <figcaption>{p.caption}. Photo: {shortCredit([p.author]) || p.author}, {p.license}</figcaption>
            </figure>
          ) : quiet ? (
            quietPanel
          ) : (
            <div className="city-head__panel" aria-hidden="true"><strong>{c.name}</strong><span>{c.county}</span></div>
          )}
        </div>
      </header>

      {quiet ? (
        p ? quietPanel : null
      ) : (
        <Browse
          variant="home"
          list={cards(mine)}
          spots={cards(spots)}
          facets={['show', 'topic', 'when', 'free']}
          lock={{ city: c.slug }}
          fixed={[{ facet: 'city', label: c.name }]}
          topics={topics}
          ctx={ctx}
          showCity={false}
          viewSwitch
          label={`Stories from ${c.name}`}
          carouselTitle={`Coming up in ${c.name}`}
        />
      )}

      <section className="hub-section" id="links" aria-labelledby="links-title">
        <h2 id="links-title" className="section-title">{c.name} links</h2>
        {links.length > 0 && <PairRows className="pairs--grid" items={links} />}
        {!links.length && <p className="muted">We have not added local links for {c.name} yet. <Link className="link" href="/submit/">Suggest one.</Link></p>}
        <p className="note-line">{near.length ? `Nearby in ${c.county}` : 'Other towns'}: {others.map((o, i) => <span key={o.slug}>{i ? ', ' : ''}<Link className="link" href={`/cities/${o.slug}/`}>{o.name}</Link></span>)}. <Link className="link" href="/cities/">All cities and towns</Link>.</p>
      </section>

      {!quiet && <JsonLd data={itemListLd(`Things to do and what’s new in ${c.name}, AR`, mine)} />}
    </div>
  );
}
