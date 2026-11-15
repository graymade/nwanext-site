import Link from 'next/link';
import { notFound } from 'next/navigation';
import Img from '@/components/Img';
import Icon from '@/components/Icon';
import JsonLd from '@/components/JsonLd';
import { Breadcrumbs, HOME } from '@/components/PageHead';
import { CalendarMenu, DirectionsLink, ShareButton } from '@/components/Bits';
import { Row } from '@/components/Rows';
import { getArticle, getArticles } from '@/lib/content';
import { item, nextStory, related, cityHref } from '@/lib/data';
import { articleLd, eventLd, pageMeta, type Crumb } from '@/lib/seo';
import { topicByName } from '@/lib/taxonomy';
import { card } from '@/lib/view';

export const dynamicParams = false;
export const generateStaticParams = () => getArticles().map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return pageMeta({
    title: a.title,
    description: a.summary || `${a.title}. ${a.city}, Northwest Arkansas.`,
    path: `/news/${a.slug}/`,
    image: a.showImage ? a.image : undefined,
    type: 'article',
  });
}

// River's rule: hide the dek when the body already says it, by sentence or by most of its words.
function showDek(summary: string, html: string) {
  if (!summary) return false;
  const body = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
  const words = (t: string) => t.toLowerCase().match(/[a-z0-9]{3,}/g) || [];
  const lead = new Set(words(body.slice(0, 400)));
  const dek = words(summary);
  const repeats = dek.length > 0 && dek.filter((w) => lead.has(w)).length / dek.length >= 0.7;
  return !body.includes(summary.slice(0, 60).replace(/…$/, '')) && !repeats;
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();
  const it = item(a);
  const c = card(it);
  const f = it.facts;
  const topic = topicByName(a.category);
  const cHref = cityHref(a.city);
  const isEvent = f.kind === 'event' && !!f.start;

  const trail: Crumb[] = [
    HOME,
    isEvent ? { name: 'Things to do', href: '/events/' } : topic ? { name: topic.h1, href: topic.href } : { name: 'All stories', href: '/news/' },
    ...(cHref ? [{ name: a.city, href: cHref }] : []),
    { name: a.title, href: `/news/${a.slug}/` },
  ];

  const photo = a.showImage && a.image ? a.image : undefined;
  const rel = related(it).map(card);
  const samePlace = f.place && rel.some((r) => r.placeSlug === f.place!.slug);
  const relTitle = samePlace ? `More at ${f.place!.name}` : `More in ${a.city}`;
  const next = card(nextStory(a.slug));
  const where = f.place ? f.place : undefined;

  return (
    <div className="page page--story">
      <Breadcrumbs trail={trail} />

      <article className="story">
        <header className="story__head section_blog-post-header4">
          <h1 className="story__title">{a.title}</h1>
          {showDek(a.summary, a.html) && <p className="story__dek">{a.summary}</p>}
          <p className="meta byline">
            {cHref ? <Link href={cHref}>{a.city}</Link> : <span>{a.city}</span>}
            {isEvent ? <Link href="/events/">Things to do</Link> : topic ? <Link href={topic.href}>{topic.h1}</Link> : null}
            <span>Posted <time dateTime={a.date}>{c.posted}</time></span>
          </p>
        </header>

        {photo && (
          <figure className="story__photo">
            <Img src={photo} alt={c.alt} sizes="(max-width: 1024px) 100vw, 40rem" priority />
            {c.credit && <figcaption>Photo: {c.credit}</figcaption>}
          </figure>
        )}

        {isEvent && !f.upcoming && (
          <p className="story__past">This was on {c.dateLabel}. <Link href="/events/">See what’s coming up.</Link></p>
        )}

        {(isEvent || f.kind === 'opening' || (f.kind === 'coming' && f.address)) && (
          <section className="facts section_event-item-header11" aria-label="Details">
            <dl className="facts__grid">
              {isEvent && (
                <div className="fact">
                  <Icon name="calendar" />
                  <dt>Date</dt>
                  <dd className="num">{c.dateLabel}</dd>
                </div>
              )}
              {isEvent && (
                <div className="fact">
                  <Icon name="clock" />
                  <dt>Time</dt>
                  <dd className="num">{f.time || 'See the source for times'}</dd>
                </div>
              )}
              {(where || f.address) && (
                <div className="fact">
                  <Icon name="pin" />
                  <dt>Where</dt>
                  <dd>
                    {where ? <Link href={`/places/${where.slug}/`}>{where.name}</Link> : <span>{f.address}</span>}
                    <span className="fact__sub">{where && f.address ? `${f.address}, ` : ''}{where ? where.city : a.city}, AR</span>
                  </dd>
                </div>
              )}
              {isEvent && (f.price || a.free) && (
                <div className="fact">
                  <Icon name="ticket" />
                  <dt>Price</dt>
                  <dd className="num">{a.free ? 'Free' : f.price}</dd>
                </div>
              )}
              {!isEvent && c.status && (
                <div className="fact">
                  <Icon name="spot" />
                  <dt>Status</dt>
                  <dd>{c.status === 'Now open' ? <span className="status"><i className="dot" aria-hidden="true" />Now open</span> : c.status}</dd>
                </div>
              )}
            </dl>
            <div className="facts__actions">
              {c.gcal && <CalendarMenu c={c} id={`cal-story-${a.slug}`} primary />}
              <DirectionsLink url={c.directions} primary={c.gcal ? true : 'main'} />
              <ShareButton href={c.href} title={a.title} primary />
            </div>
          </section>
        )}

        <div className="prose" dangerouslySetInnerHTML={{ __html: a.html }} />

        <section className="sources" aria-labelledby="sources-title">
          <h2 id="sources-title">Sources</h2>
          {a.sources.length ? (
            <ul>{a.sources.map((s, n) => <li key={n}>{s.url ? <a href={s.url} rel="nofollow noopener">{s.name}</a> : s.name}</li>)}</ul>
          ) : <p className="muted">Listed in the original post.</p>}
          {!photo && a.credits.length > 0 && <p className="muted">{a.credits.join('. ')}</p>}
          {(a.instagram || a.instagramAlso) && (
            <p className="sources__ig">
              {a.instagram && <a href={a.instagram}><Icon name="instagram" />See the post on Instagram</a>}
              {a.instagramAlso && <a href={a.instagramAlso}><Icon name="instagram" />Watch the Reel</a>}
            </p>
          )}
        </section>

        {!(isEvent || f.kind === 'opening' || (f.kind === 'coming' && f.address)) && (
          <div className="story__end"><ShareButton href={c.href} title={a.title} primary /></div>
        )}
      </article>

      <div className="story__rail">
        {rel.length > 0 && (
          <section className="related" aria-labelledby="related-title">
            <h2 id="related-title" className="section-title">{relTitle}</h2>
            <ul className="rows">{rel.map((r) => <Row key={r.slug} c={r} />)}</ul>
          </section>
        )}

        <aside className="nextstory" aria-labelledby="next-title">
          <h2 id="next-title" className="section-title">Next story</h2>
          <div className="nextstory__card">
            {next.image && <span className="nextstory__img"><Img src={next.image} alt="" sizes="(max-width: 1024px) 100vw, 28rem" /></span>}
            <Link className="nextstory__link" href={next.href}>{next.title}</Link>
            <span className="meta"><span className="num">{next.kind === 'event' ? next.dateLabel : next.posted}</span><span>{next.city}</span></span>
          </div>
        </aside>
      </div>

      <JsonLd data={articleLd(a, f)} />
      {isEvent && <JsonLd data={eventLd(a, f)!} />}
    </div>
  );
}
