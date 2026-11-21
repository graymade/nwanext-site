import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'New restaurants and shops in Northwest Arkansas', description: 'Restaurants, coffee shops and stores that just opened across Benton and Washington counties.', path: '/openings/' });

export default function Page() {
  return <><Html html={P.openingsPage()} /></>;
}
