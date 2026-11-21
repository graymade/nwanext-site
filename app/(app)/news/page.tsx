import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'News', description: 'What’s being built, proposed and changed across Benton and Washington counties, with the source on every story.', path: '/news/' });

export default function Page() {
  return <><Html html={P.newsPage()} /></>;
}
