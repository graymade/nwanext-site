import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const metadata = pageMeta({ title: 'Credits', description: 'Where NWA Next stories and photos come from: sources and photo credits for every story, and licenses for town photos.', path: '/credits/' });

export default function Page() {
  return <><Html html={P.credits()} /></>;
}
