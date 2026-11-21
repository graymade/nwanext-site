import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'NWA Next', description: 'New eats, events & openings across Northwest Arkansas. If it’s worth leaving the house for, it’s here.', path: '/' });
metadata.title = { absolute: 'NWA Next | New eats, events and openings in Northwest Arkansas' };

export default function Page() {
  return <Html html={P.home()} />;
}
