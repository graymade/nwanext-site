// The one filter system: Show, City, Topic, When and Free over any list of stories.
// Client-safe. State lives in the URL (?show=events&city=rogers,bentonville&topic=food-and-drink&when=weekend&free=1).
import type { Card } from './view';

export type Show = 'all' | 'events' | 'spots' | 'news';
export type When = 'any' | 'upcoming' | 'weekend' | 'week' | 'past';
export type FilterState = {
  show: Show;
  cities: string[] | null; // null = not touched yet: the saved "my city" applies
  topics: string[];
  when: When;
  free: boolean;
};
export type Ctx = { today: string; weekend: { from: string; to: string }; week: { from: string; to: string } };
export type Facet = 'show' | 'city' | 'topic' | 'when' | 'free';

export const SHOWS: { value: Show; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'events', label: 'Events' },
  { value: 'spots', label: 'New spots' },
  { value: 'news', label: 'News' },
];
export const WHENS: { value: When; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'past', label: 'Past' },
];

export const EMPTY: FilterState = { show: 'all', cities: null, topics: [], when: 'any', free: false };

// The cities that actually apply: what the reader picked, else their saved city.
export const effectiveCities = (s: FilterState, saved: string) => s.cities ?? (saved ? [saved] : []);

const isEvent = (c: Card) => c.kind === 'event' && !!c.start;
const overlaps = (c: Card, from: string, to: string) => c.start! <= to && (c.end || c.day || c.start!) >= from;

function inShow(c: Card, show: Show) {
  if (show === 'events') return isEvent(c);
  if (show === 'spots') return c.kind === 'opening' || c.kind === 'coming';
  if (show === 'news') return c.kind === 'news';
  return true;
}

// Time only applies to events, so any When other than "Any time" narrows the list to events.
function inWhen(c: Card, when: When, x: Ctx) {
  if (when === 'any') return true;
  if (!isEvent(c)) return false;
  if (when === 'upcoming') return c.upcoming;
  if (when === 'past') return !c.upcoming;
  if (when === 'weekend') return overlaps(c, x.weekend.from, x.weekend.to);
  return overlaps(c, x.week.from, x.week.to);
}

export function matches(c: Card, s: FilterState, cities: string[], x: Ctx, skip?: Facet) {
  if (skip !== 'show' && !inShow(c, s.show)) return false;
  if (skip !== 'city' && cities.length && !cities.includes(c.citySlug || '')) return false;
  if (skip !== 'topic' && s.topics.length && !s.topics.includes(c.topic || '')) return false;
  if (skip !== 'when' && !inWhen(c, s.when, x)) return false;
  if (skip !== 'free' && s.free && !c.free) return false;
  return true;
}

// Faceted counts: each option counted against every other active filter.
export function counts(list: Card[], s: FilterState, cities: string[], x: Ctx) {
  const by = (facet: Facet, key: (c: Card) => string | string[]) => {
    const m: Record<string, number> = {};
    for (const c of list) {
      if (!matches(c, s, cities, x, facet)) continue;
      const k = key(c);
      for (const v of Array.isArray(k) ? k : [k]) m[v] = (m[v] || 0) + 1;
    }
    return m;
  };
  return {
    show: by('show', (c) => ['all', ...SHOWS.filter((o) => o.value !== 'all' && inShow(c, o.value)).map((o) => o.value)]),
    city: by('city', (c) => c.citySlug || ''),
    topic: by('topic', (c) => c.topic || ''),
    when: by('when', (c) => WHENS.filter((o) => inWhen(c, o.value, x)).map((o) => o.value)),
    free: list.filter((c) => c.free && matches(c, s, cities, x, 'free')).length,
  };
}
export type Counts = ReturnType<typeof counts>;

const list = (v: string | null) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);

export function fromParams(q: URLSearchParams, topicByName: (name: string) => string | undefined): Partial<FilterState> {
  const out: Partial<FilterState> = {};
  const show = q.get('show') as Show | null;
  if (show && SHOWS.some((o) => o.value === show)) out.show = show;
  if (q.has('city')) out.cities = list(q.get('city'));
  const topics = [...list(q.get('topic')), ...list(q.get('category')).map((n) => topicByName(n) || n)];
  if (topics.length) out.topics = topics;
  const when = q.get('when') as When | null;
  if (when && WHENS.some((o) => o.value === when)) out.when = when;
  if (q.get('free') === '1') out.free = true;
  return out;
}

export function toParams(s: FilterState, locked: Facet[] = []) {
  const q: [string, string][] = [];
  if (s.show !== 'all' && !locked.includes('show')) q.push(['show', s.show]);
  if (s.cities !== null && !locked.includes('city')) q.push(['city', s.cities.join(',')]);
  if (s.topics.length && !locked.includes('topic')) q.push(['topic', s.topics.join(',')]);
  if (s.when !== 'any' && !locked.includes('when')) q.push(['when', s.when]);
  if (s.free) q.push(['free', '1']);
  return q;
}
