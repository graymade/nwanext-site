import { notFound } from 'next/navigation';
import Html from '@/components/Html';
import JsonLd from '@/components/JsonLd';
import { getArticle, getArticles } from '@/lib/content';
import { item } from '@/lib/data';
import { articleLd, eventLd, pageMeta } from '@/lib/seo';
import { view } from '@/lib/render/kit';
import * as P from '@/lib/render/pages';

export const dynamicParams = false;
export const generateStaticParams = () => getArticles().map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return pageMeta({ title: a.title, description: a.summary || `${a.title}. ${a.city}, Northwest Arkansas.`, path: `/news/${a.slug}/`, image: a.showImage ? a.image : undefined, type: 'article' });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();
  const it = item(a);
  const ev = eventLd(a, it.facts);
  return (
    <>
      <JsonLd data={articleLd(a, it.facts)} />
      {ev && <JsonLd data={ev} />}
      <Html html={P.story(view(it))} />
    </>
  );
}
