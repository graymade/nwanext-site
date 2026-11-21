import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Free things to do in Northwest Arkansas', description: 'Free events and outings across Benton and Washington counties. Updated as we post.', path: '/guides/free-things-to-do/' });

export default function Page() {
  return <><Html html={P.freeGuide()} /></>;
}
