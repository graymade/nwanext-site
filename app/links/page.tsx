import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Links', description: 'NWA Next: what’s on, new spots, the latest stories and the newsletter.', path: '/links/', noindex: true });

export default function Page() {
  return <><Html html={P.links()} /></>;
}
