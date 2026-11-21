import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Get connected in Northwest Arkansas', description: 'Ways to plug in around NWA: free events, volunteering, the newsletter and how to reach NWA Next.', path: '/connect/' });

export default function Page() {
  return <><Html html={P.connect()} /></>;
}
