import Html from '@/components/Html';
import { getCities, photo } from '@/lib/content';
import { pageMeta } from '@/lib/seo';
import { inArea } from '@/lib/render/kit';
import * as P from '@/lib/render/pages';
import { getPhotos } from '@/lib/content';

export const dynamicParams = false;
// Every town keeps its address. Towns outside Benton and Washington counties point people to /cities/ (noindex, out of the sitemap).
export const generateStaticParams = () => getCities().map((c) => ({ city: c.slug }));

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const c = getCities().find((x) => x.slug === city);
  if (!c) return {};
  if (!inArea(c)) return { ...pageMeta({ title: c.name, description: 'NWA Next covers Benton and Washington counties.', path: '/cities/', noindex: true }) };
  const ph = getPhotos().find((p) => p.city === c.name);
  return pageMeta({ title: `Things to do and what’s new in ${c.name}, AR`, description: `Events, new restaurants and shops, and what’s changing in ${c.name}, Arkansas. ${c.intro}`, path: `/cities/${c.slug}/`, image: ph ? photo(ph.slug)?.src : undefined });
}

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const c = getCities().find((x) => x.slug === city)!;
  if (!inArea(c)) return <><meta httpEquiv="refresh" content="0; url=/cities/" /><Html html={P.outOfArea(c)} /></>;
  return <Html html={P.town(c)} />;
}
