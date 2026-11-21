import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Towns in Benton and Washington counties', description: 'Every town we cover in Benton and Washington counties on one map, with events, new spots and local news for each.', path: '/cities/' });

export default function Page() {
  return <><Html html={P.towns()} /></>;
}
