import Html from '@/components/Html';
import JsonLd from '@/components/JsonLd';
import { itemListLd, breadcrumbLd } from '@/lib/seo';
import { items, upcoming, openings } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'News', description: 'What’s being built, proposed and changed across Benton and Washington counties, with the source on every story.', path: '/news/' });

export default function Page() {
  return <><JsonLd data={itemListLd('NWA Next news', items().filter((i) => i.facts.kind === 'news' || i.facts.kind === 'coming'))} /><JsonLd data={breadcrumbLd([{ name: 'Home', href: '/' }, { name: 'News', href: '/news/' }])} /><Html html={P.newsPage()} /></>;
}
