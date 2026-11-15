import { calendar, feedEvents, icsResponse } from '@/lib/ics';

export const dynamic = 'force-static';

// The subscribable NWA Next calendar: every upcoming event plus the last 60 days.
export function GET() {
  return icsResponse(calendar({ name: 'NWA Next', events: feedEvents(), feed: true }));
}
