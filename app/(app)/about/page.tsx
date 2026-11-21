import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'About', description: 'What NWA Next covers, where our stories and photos come from, and how to reach us.', path: '/about/' });

export default function Page() {
  return <><Html html={P.about()} /></>;
}
