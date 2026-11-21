import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const dynamicParams = false;
export const generateStaticParams = () => P.placeStats().map((p) => ({ place: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ place: string }> }) {
  const { place } = await params;
  const p = P.placeStats().find((x) => x.slug === place);
  return p ? pageMeta({ title: `${p.name} in ${p.city}: events and news`, description: `${p.blurb} What’s coming up at ${p.name} and what we covered before.`, path: `/places/${p.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ place: string }> }) {
  const { place } = await params;
  return <Html html={P.place(place)} />;
}
