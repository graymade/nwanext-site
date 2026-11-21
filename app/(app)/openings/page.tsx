import Html from '@/components/Html';
import JsonLd from '@/components/JsonLd';
import { itemListLd, breadcrumbLd } from '@/lib/seo';
import { items, upcoming, openings } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'New restaurants and shops in Northwest Arkansas', description: 'Restaurants, coffee shops and stores that just opened across Benton and Washington counties.', path: '/openings/' });

export default function Page() {
  return <><JsonLd data={itemListLd('New restaurants and shops in Northwest Arkansas', openings())} /><JsonLd data={breadcrumbLd([{ name: 'Home', href: '/' }, { name: 'New spots', href: '/openings/' }])} /><Html html={P.openingsPage()} /></>;
}
