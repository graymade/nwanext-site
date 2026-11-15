import Browse from '@/components/Browse';
import JsonLd from '@/components/JsonLd';
import PageHead, { HOME } from '@/components/PageHead';
import ViewLinks from '@/components/ViewLinks';
import { getCities } from '@/lib/content';
import { items } from '@/lib/data';
import { feedEvents, subscribeLinks } from '@/lib/ics';
import { itemListLd, pageMeta } from '@/lib/seo';
import { TODAY } from '@/lib/now';
import { browseBase, cards } from '@/lib/view';

export const metadata = pageMeta({
  title: 'Northwest Arkansas events calendar',
  description: 'Every event we cover in Northwest Arkansas on one month calendar, by city and topic. Subscribe once in Apple, Google or Outlook and new events show up on their own.',
  path: '/calendar/',
});

export default function CalendarPage() {
  const { ctx, topics } = browseBase();
  const events = items().filter((i) => i.facts.kind === 'event' && i.facts.start);
  const list = cards(events);
  const month = TODAY.slice(0, 7);
  const starts = events.map((i) => i.facts.start!.slice(0, 7));
  const ends = events.map((i) => (i.facts.end || i.facts.start!).slice(0, 7));
  const bounds = { min: [month, ...starts].sort()[0], max: [month, ...ends].sort().at(-1)! };
  const inMonth = events.filter((i) => i.facts.start!.slice(0, 7) <= month && (i.facts.end || i.facts.start!).slice(0, 7) >= month);
  const citySubs = Object.fromEntries(getCities().filter((c) => feedEvents(c.name).length > 0).map((c) => [c.slug, subscribeLinks(`/calendar/${c.slug}/calendar.ics`, `NWA Next: ${c.name}`)]));
  return (
    <div className="page page--calendar">
      <Browse
        variant="calendar"
        list={list}
        facets={['city', 'topic', 'free']}
        lock={{ show: 'events' }}
        topics={topics}
        ctx={ctx}
        noun={['event', 'events']}
        month={month}
        bounds={bounds}
        subscribe={subscribeLinks('/calendar.ics')}
        citySubs={citySubs}
        label="Filter the calendar"
        head={
          <PageHead trail={[HOME, { name: 'Calendar', href: '/calendar/' }]} title="Events calendar">
            <ViewLinks current="month" />
          </PageHead>
        }
      />
      <JsonLd data={itemListLd('Northwest Arkansas events calendar', inMonth)} />
    </div>
  );
}
