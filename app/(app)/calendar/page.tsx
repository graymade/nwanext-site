import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Northwest Arkansas events calendar', description: 'Every event we cover in Benton and Washington counties on a month calendar. Subscribe once in Apple, Google or Outlook and new events show up on their own.', path: '/calendar/' });

export default function Page() {
  return <><Html html={P.calendar()} /></>;
}
