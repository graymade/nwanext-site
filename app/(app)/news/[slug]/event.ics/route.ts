import { getArticle } from '@/lib/content';
import { item, items } from '@/lib/data';
import { calendar, icsResponse } from '@/lib/ics';

export const dynamic = 'force-static';
export const dynamicParams = false;
export const generateStaticParams = () => items().filter((i) => i.facts.kind === 'event').map((i) => ({ slug: i.slug }));

// "Add to calendar" for Apple Calendar and Outlook: one event per story, in Central time.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return icsResponse(calendar({ name: 'NWA Next', events: [item(getArticle(slug)!)], feed: false }));
}
