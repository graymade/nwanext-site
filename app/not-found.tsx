import Html from '@/components/Html';
import * as P from '@/lib/render/pages';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return <Html html={P.notFound()} />;
}
