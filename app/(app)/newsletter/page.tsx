import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Newsletter', description: 'The free NWA Next newsletter: new eats, events and openings across Northwest Arkansas.', path: '/newsletter/' });

export default function Page() {
  return <><Html html={P.newsletterPage()} /></>;
}
