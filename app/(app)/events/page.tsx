import Browse from '@/components/Browse';
import JsonLd from '@/components/JsonLd';
import PageHead, { HOME } from '@/components/PageHead';
import ViewLinks from '@/components/ViewLinks';
import { pastEvents, upcoming } from '@/lib/data';
import { feedEvents, subscribeLinks } from '@/lib/ics';
import { getCities } from '@/lib/content';
import { itemListLd, pageMeta } from '@/lib/seo';
import { browseBase, cards, dayName, nextDays } from '@/lib/view';

export const metadata = pageMeta({
  title: 'Things to do in Northwest Arkansas',
  description: 'Concerts, festivals, markets and free outings across Northwest Arkansas, by day, with times, places and prices. Subscribe to add them to your calendar.',
  path: '/events/',
});

export default function EventsPage() {
  const { ctx, topics } = browseBase();
  const up = upcoming();
  const events = [...up, ...pastEvents()];
  const list = cards(events);
  const citySubs = Object.fromEntries(getCities().filter((c) => feedEvents(c.name).length > 0).map((c) => [c.slug, subscribeLinks(`/calendar/${c.slug}/calendar.ics`, `NWA Next: ${c.name}`)]));
  const dayNames = Object.fromEntries([...new Set(list.filter((c) => c.upcoming).map((c) => c.day!))].map((d) => [d, dayName(d)]));
  return (
    <div className="page page--events">
      <Browse
        variant="agenda"
        list={list}
        facets={['city', 'topic', 'when', 'free']}
        lock={{ show: 'events' }}
        topics={topics}
        ctx={ctx}
        noun={['event', 'events']}
        days={nextDays(14)}
        dayNames={dayNames}
        nothingAtAll={up.length === 0}
        label="Filter events"
        subscribe={subscribeLinks('/calendar.ics')}
        citySubs={citySubs}
        head={
          <PageHead
            trail={[HOME, { name: 'Things to do', href: '/events/' }]}
            title="Things to do in Northwest Arkansas"
          >
            <ViewLinks current="list" />
          </PageHead>
        }
      />
      <JsonLd data={itemListLd('Things to do in Northwest Arkansas', up.length ? up : pastEvents())} />
    </div>
  );
}
