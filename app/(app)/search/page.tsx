import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Search', description: 'Search every NWA Next story, place, town and guide.', path: '/search/', noindex: true });

export default function Page() {
  return <><Html html={P.search()} /></>;
}
