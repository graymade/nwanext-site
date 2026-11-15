import Browse from '@/components/Browse';
import JsonLd from '@/components/JsonLd';
import PageHead, { HOME } from '@/components/PageHead';
import { comingSoon, openings } from '@/lib/data';
import { itemListLd, pageMeta } from '@/lib/seo';
import { browseBase, cards } from '@/lib/view';

export const metadata = pageMeta({
  title: 'New restaurants and shops in Northwest Arkansas',
  description: 'Restaurants, coffee shops and stores that just opened across Northwest Arkansas, plus what is proposed or coming soon.',
  path: '/openings/',
});

export default function OpeningsPage() {
  const { ctx, topics } = browseBase();
  const list = [...openings(), ...comingSoon()];
  return (
    <div className="page page--openings">
      <Browse
        variant="spots"
        list={cards(list)}
        facets={['city', 'topic']}
        lock={{ show: 'spots' }}
        topics={topics}
        ctx={ctx}
        noun={['spot', 'spots']}
        viewSwitch
        label="Filter new spots"
        head={<PageHead trail={[HOME, { name: 'New spots', href: '/openings/' }]} title="New in Northwest Arkansas" lede="Restaurants, coffee and shops that just opened or are on the way." />}
      />
      <JsonLd data={itemListLd('New restaurants and shops in Northwest Arkansas', list)} />
    </div>
  );
}
