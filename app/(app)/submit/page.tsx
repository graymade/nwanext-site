import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Send a tip', description: 'Know about a new spot, an event or something changing in Benton or Washington county? Tell NWA Next, or email hello@nwanext.com.', path: '/submit/' });

export default function Page() {
  return <><Html html={P.submit()} /></>;
}
