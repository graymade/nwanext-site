import Html from '@/components/Html';
import JsonLd from '@/components/JsonLd';
import { itemListLd, breadcrumbLd } from '@/lib/seo';
import { items, upcoming, openings } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Northwest Arkansas events calendar', description: 'Every event we cover in Benton and Washington counties on a month calendar. Subscribe once in Apple, Google or Outlook and new events show up on their own.', path: '/calendar/' });

export default function Page() {
  return <><JsonLd data={itemListLd('Northwest Arkansas events calendar', items().filter((i) => i.facts.kind === 'event'))} /><JsonLd data={breadcrumbLd([{ name: 'Home', href: '/' }, { name: 'Calendar', href: '/calendar/' }])} /><Html html={P.calendar()} /></>;
}
