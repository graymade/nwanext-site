import { getCities } from '@/lib/content';
import { calendar, feedEvents, icsResponse } from '@/lib/ics';

export const dynamic = 'force-static';
export const dynamicParams = false;
// One feed per featured city, plus any other town with an event in the window. Featured cities always
// get one, so the static export never sees an empty list (and old subscriptions keep working).
export const generateStaticParams = () => getCities().filter((c) => c.featured || feedEvents(c.name).length > 0).map((c) => ({ city: c.slug }));

export async function GET(_req: Request, { params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const c = getCities().find((x) => x.slug === city)!;
  return icsResponse(calendar({ name: `NWA Next: ${c.name}`, events: feedEvents(c.name), feed: true }));
}
