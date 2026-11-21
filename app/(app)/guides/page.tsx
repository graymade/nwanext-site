import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Guides and local resources', description: 'Starter guides and a directory of Northwest Arkansas city halls, libraries, getting around, things to do and ways to volunteer.', path: '/guides/' });

export default function Page() {
  return <><Html html={P.guides()} /></>;
}
