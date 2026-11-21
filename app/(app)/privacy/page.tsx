import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Privacy', description: 'What nwanext.com keeps, why, and how to have it removed.', path: '/privacy/' });

export default function Page() {
  return <><Html html={P.privacy()} /></>;
}
