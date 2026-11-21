import { notFound } from 'next/navigation';
import Html from '@/components/Html';
import { getGuides } from '@/lib/content';
import { pageMeta } from '@/lib/seo';
import * as P from '@/lib/render/pages';

export const dynamicParams = false;
export const generateStaticParams = () => getGuides().map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuides().find((x) => x.slug === slug);
  return g ? pageMeta({ title: g.title, description: g.summary, path: `/guides/${g.slug}/` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getGuides().some((g) => g.slug === slug)) notFound();
  return <Html html={P.guide(slug)} />;
}
