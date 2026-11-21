import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Things to do in Northwest Arkansas', description: 'Concerts, festivals, markets and free outings across Benton and Washington counties, by day, with times, places and prices. Save them or add them to your calendar.', path: '/events/' });

export default function Page() {
  return <><Html html={P.events()} /></>;
}
