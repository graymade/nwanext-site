import Html from '@/components/Html';
import { pageMeta } from '@/lib/seo';
import { TOPICS, topicBySlug } from '@/lib/taxonomy';
import { all } from '@/lib/render/kit';
import * as P from '@/lib/render/pages';

export const dynamicParams = false;
export const generateStaticParams = () => TOPICS.filter((t) => t.slug !== 'events').map((t) => ({ topic: t.slug }));

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = topicBySlug(topic);
  if (!t) return {};
  const count = all().filter((v) => v.topic === t.name).length;
  return pageMeta({ title: t.title, description: `${t.blurb} From towns across Benton and Washington counties.`, path: t.href, noindex: count < 3 });
}

export default async function Page({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  return <Html html={P.topic(topicBySlug(topic)!)} />;
}
