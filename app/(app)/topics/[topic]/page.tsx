import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PageHead, { HOME } from '@/components/PageHead';
import Browse from '@/components/Browse';
import Link from 'next/link';
import { items, topicStats } from '@/lib/data';
import { itemListLd, pageMeta } from '@/lib/seo';
import { TOPICS, topicBySlug } from '@/lib/taxonomy';
import { browseBase, cards } from '@/lib/view';

export const dynamicParams = false;
export const generateStaticParams = () => TOPICS.filter((t) => t.slug !== 'events').map((t) => ({ topic: t.slug }));

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = topicBySlug(topic);
  if (!t) return {};
  const count = items().filter((i) => i.category === t.name).length;
  return pageMeta({ title: t.title, description: `${t.blurb} From towns across Northwest Arkansas.`, path: t.href, noindex: count < 3 });
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = topicBySlug(topic);
  if (!t) notFound();
  const list = items().filter((i) => i.category === t.name);
  const { ctx, topics } = browseBase();
  const siblings = topicStats().filter((x) => x.slug !== t.slug && x.count > 0);
  return (
    <div className="page page--topic">
      <Browse
        variant="feed"
        list={cards(list)}
        facets={['show', 'city', 'when', 'free']}
        lock={{ topic: t.slug }}
        fixed={[{ facet: 'topic', label: t.h1 }]}
        topics={topics}
        ctx={ctx}
        viewSwitch
        label={t.h1}
        head={<PageHead trail={[HOME, { name: 'All stories', href: '/news/' }, { name: t.h1, href: t.href }]} title={t.h1} lede={t.blurb} />}
      />
      <nav className="hub-section" aria-labelledby="other-topics">
        <h2 id="other-topics" className="section-title">Other topics</h2>
        <ul className="pairs pairs--compact">
          {siblings.map((s) => <li key={s.slug} className="pair"><Link className="pair__link" href={s.href}>{s.h1}</Link><span className="pair__note">{s.count} {s.count === 1 ? 'story' : 'stories'}</span></li>)}
        </ul>
      </nav>
      <JsonLd data={itemListLd(t.title, list)} />
    </div>
  );
}
