import Browse from '@/components/Browse';
import PageHead, { HOME } from '@/components/PageHead';
import { items } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import { browseBase, cards } from '@/lib/view';

export const metadata = pageMeta({
  title: 'All stories',
  description: 'Every NWA Next story, newest first: openings, events, development and local news from every town we cover in Northwest Arkansas.',
  path: '/news/',
});

export default function NewsPage() {
  const { ctx, topics } = browseBase();
  return (
    <div className="page page--news">
      <Browse
        variant="feed"
        list={cards(items())}
        facets={['show', 'city', 'topic', 'when', 'free']}
        topics={topics}
        ctx={ctx}
        viewSwitch
        label="All stories"
        head={<PageHead trail={[HOME, { name: 'All stories', href: '/news/' }]} title="All stories" />}
      />
    </div>
  );
}
