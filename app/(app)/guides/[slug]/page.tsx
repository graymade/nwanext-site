import { notFound } from 'next/navigation';
import PageHead, { HOME } from '@/components/PageHead';
import PairRows from '@/components/PairRows';
import { getGuides, getResources, slugify } from '@/lib/content';
import { pageMeta } from '@/lib/seo';
import { guidePairs } from '@/lib/site';

export const dynamicParams = false;
export const generateStaticParams = () => getGuides().map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuides().find((x) => x.slug === slug);
  return g ? pageMeta({ title: g.title, description: g.summary, path: `/guides/${g.slug}/` }) : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuides().find((x) => x.slug === slug);
  if (!g) notFound();
  const more = guidePairs().filter((p) => p.href !== `/guides/${g.slug}/` && !p.href.endsWith('#directory'));
  const groups = getResources().groups;
  return (
    <article className="page page--guide">
      <PageHead trail={[HOME, { name: 'Guides', href: '/guides/' }, { name: g.title, href: `/guides/${g.slug}/` }]} title={g.title} lede={g.summary} />
      <div className="reading">
        <div className="prose" dangerouslySetInnerHTML={{ __html: g.html }} />
        <aside className="reading__rail" aria-label="More guides">
          <section className="related" aria-labelledby="more-guides">
            <h2 id="more-guides" className="section-title">More guides</h2>
            <PairRows items={more} />
          </section>
          <section className="related" aria-labelledby="dir-title">
            <h2 id="dir-title" className="section-title">Local directory</h2>
            <PairRows className="pairs--compact" items={groups.map((d) => ({ href: `/guides/#${slugify(d.title)}`, name: d.title }))} />
          </section>
        </aside>
      </div>
    </article>
  );
}
