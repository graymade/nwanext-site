// View models for list components. Server only: every string a client list shows is worked out here,
// at build time, so server and client render the same thing and the client stays small.
import { getArticle, getCities, getSite, absoluteUrl } from './content';
import { items as allItems, showDay, topicStats, weekend as weekendRange, type Item } from './data';
import { TODAY, addDays } from './now';
import { dateParts, directionsUrl, eventDateLabel, googleCalendarUrl, whereLine } from './when';
import { shortDate, statusWord } from './format';
import { topicByName } from './taxonomy';

export type Card = {
  slug: string;
  href: string;
  title: string;
  summary: string;
  city: string;
  citySlug?: string;
  category: string;
  topicHref?: string;
  topic?: string; // topic slug, for the filters
  kind: 'event' | 'opening' | 'coming' | 'news';
  image?: string;
  w?: number;
  h?: number;
  alt: string;
  credit?: string;
  free: boolean;
  price?: string;
  status?: string; // "Proposed", "Could reopen", "Now open"
  upcoming: boolean;
  day?: string; // the calendar day an event shows under
  start?: string;
  end?: string; // last day of a multi-day event
  dateLabel?: string; // "Wed, Sep 23" or "Sep 25–27"
  dayShort?: string; // "Sep 23"
  time?: string; // "6 PM"
  startLabel?: string; // "5 PM" from "5–9 PM"
  weekday?: string; // "Wed"
  dayNum?: string; // "23"
  month?: string; // "Sep"
  posted: string; // "Sep 21"
  ago: string; // "3 days ago" or "Sep 2"
  where: string; // "Ozark Music Hall, Fayetteville"
  address?: string;
  placeName?: string;
  placeSlug?: string;
  gcal?: string;
  ics?: string;
  directions?: string;
  date: string; // ISO post date
};

const DAY = 86400000;

// "17:30" -> "5:30 PM"
const clock12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};

// "Today", "Yesterday", "3 days ago", "Last week". Past two weeks it is the plain date.
export function ago(iso: string) {
  const posted = new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const days = Math.round((new Date(`${TODAY}T12:00:00Z`).getTime() - new Date(`${posted}T12:00:00Z`).getTime()) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  return shortDate(iso);
}

// What the coming-soon rows say instead of "Opening".
function comingWord(i: Item) {
  if (/could be coming back|reopen/i.test(i.title)) return 'Could reopen';
  if (/proposed/i.test(i.title)) return 'Proposed';
  if (i.status === 'building') return 'Building';
  return statusWord(i.status) || 'Coming soon';
}

// Alt text from the CMS when there is one, else a short line built from the headline.
export const altFor = (slug: string, title: string) => getArticle(slug)?.imageAlt || `Photo for the story: ${title}`;

export function card(i: Item): Card {
  const f = i.facts;
  const cities = getCities();
  const citySlug = cities.find((c) => c.name === i.city)?.slug;
  const isEvent = f.kind === 'event' && !!f.start;
  const day = isEvent ? showDay(i) : undefined;
  const parts = day ? dateParts(day) : undefined;
  const where = whereLine(f, i.city);
  const location = [f.place?.name, f.address, `${f.place?.city || i.city}, AR`].filter(Boolean).join(', ');
  const dir = f.kind !== 'news' ? directionsUrl(f, i.city) : '';
  return {
    slug: i.slug,
    href: i.href,
    title: i.title,
    summary: i.summary,
    city: i.city,
    citySlug,
    category: i.category,
    topicHref: topicByName(i.category)?.href,
    topic: topicByName(i.category)?.slug,
    kind: f.kind,
    image: i.image,
    w: i.w,
    h: i.h,
    alt: altFor(i.slug, i.title),
    credit: i.credit,
    free: i.free,
    price: f.price,
    status: f.kind === 'opening' ? 'Now open' : f.kind === 'coming' ? comingWord(i) : undefined,
    upcoming: f.upcoming,
    day,
    start: f.start,
    end: f.end,
    dateLabel: isEvent ? eventDateLabel(f) : undefined,
    dayShort: isEvent ? eventDateLabel(f, false) : undefined,
    time: f.time,
    startLabel: f.startTime ? clock12(f.startTime) : undefined,
    weekday: parts?.weekday,
    dayNum: parts?.day,
    month: parts?.month,
    posted: shortDate(i.date),
    ago: ago(i.date),
    where,
    address: f.address,
    placeName: f.place?.name,
    placeSlug: f.place?.slug,
    gcal: isEvent && f.upcoming ? googleCalendarUrl(i.title, f, `${i.summary}\n\n${absoluteUrl(i.href)}`, location) : undefined,
    ics: isEvent && f.upcoming ? `${i.href}event.ics` : undefined,
    directions: dir || undefined,
    date: i.date,
  };
}

export const cards = (list: Item[] = allItems()) => list.map(card);

export type CityLite = { slug: string; name: string; county: string; featured: boolean; count: number; upcoming: number; spots: number };
export function cityList(): CityLite[] {
  const list = allItems();
  return getCities().map((c) => {
    const mine = list.filter((i) => i.city === c.name);
    return {
      slug: c.slug,
      name: c.name,
      county: c.county,
      featured: c.featured,
      count: mine.length,
      upcoming: mine.filter((i) => i.facts.kind === 'event' && i.facts.upcoming).length,
      spots: mine.filter((i) => i.facts.kind === 'opening' || i.facts.kind === 'coming').length,
    };
  });
}

export const siteLite = () => {
  const s = getSite();
  return { handle: s.instagramHandle, instagram: s.instagram, action: s.newsletter.action, emailField: s.newsletter.emailField };
};

// The next n days for the day scroller, and headings like "Friday, Sep 25".
const at = (key: string) => new Date(`${key}T12:00:00Z`);
export const dayName = (key: string) => at(key).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' });
export function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const key = addDays(TODAY, i);
    return { key, weekday: at(key).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' }), day: String(at(key).getUTCDate()), long: dayName(key) };
  });
}

// What every filtered list needs from the server: today, this weekend, the next 7 days, the topics.
export function browseBase() {
  const w = weekendRange();
  return {
    ctx: { today: TODAY, weekend: w, week: { from: TODAY, to: addDays(TODAY, 6) } },
    topics: topicStats().filter((t) => t.count > 0).map((t) => ({ slug: t.slug, name: t.h1 })),
  };
}
