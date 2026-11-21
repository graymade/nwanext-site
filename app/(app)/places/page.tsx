import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Places we cover often', description: 'The Northwest Arkansas venues that keep coming up, like The Momentary and Walton Arts Center, with their events and news.', path: '/places/' });

export default function Page() {
  return <><Html html={P.places()} /></>;
}
