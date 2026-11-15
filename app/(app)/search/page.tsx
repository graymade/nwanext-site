import PageHead, { HOME } from '@/components/PageHead';
import Search from '@/components/Search';
import { weekend } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import { TODAY } from '@/lib/now';

export const metadata = pageMeta({
  title: 'Search',
  description: 'Search every NWA Next story, place, city and guide.',
  path: '/search/',
  noindex: true,
});

export default function SearchPage() {
  return (
    <div className="page page--search">
      <PageHead trail={[HOME, { name: 'Search', href: '/search/' }]} title="Search" />
      <Search mode="page" today={TODAY} weekend={weekend()} />
    </div>
  );
}
