// Every list the pages need, in one place. Server only (reads content through lib/content).
import { getArticles, getCities, getGuides, story, type Article, type Story } from './content';
import { factsFor, type Facts } from './facts';
import { PLACES, TOPICS, topicByName } from './taxonomy';
import { TODAY, addDays } from './now';

// What list components get for each story: the lite shape, the photo's size and its key facts.
export type Item = Story & { href: string; facts: Facts };
export const item = (a: Article): Item => ({ ...story(a), href: `/news/${a.slug}/`, facts: factsFor(a) });

export const items = () => getArticles().map(item);
const byStart = (a: Item, b: Item) => (a.facts.start! < b.facts.start! ? -1 : a.facts.start! > b.facts.start! ? 1 : (a.facts.startTime || '') < (b.facts.startTime || '') ? -1 : 1);

// Events that have not ended, soonest first. A multi-day event counts from today while it runs.
export const upcoming = (list = items()) => list.filter((i) => i.facts.kind === 'event' && i.facts.upcoming).sort(byStart);
// Events that are over, most recent first.
export const pastEvents = (list = items()) => list.filter((i) => i.facts.kind === 'event' && !i.facts.upcoming).sort((a, b) => -byStart(a, b));
export const openings = (list = items()) => list.filter((i) => i.facts.kind === 'opening');
export const comingSoon = (list = items()) => list.filter((i) => i.facts.kind === 'coming');

// The day an event shows under in a calendar: its start, or today if it started already and still runs.
export const showDay = (i: Item) => (i.facts.start! < TODAY && i.facts.end ? TODAY : i.facts.start!);

// Upcoming events grouped by day: [{ day: '2026-09-25', items: [...] }].
export function byDay(list: Item[]) {
  const map = new Map<string, Item[]>();
  for (const i of list) {
    const d = showDay(i);
    map.set(d, [...(map.get(d) || []), i]);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([day, items]) => ({ day, items }));
}

// This Friday to Sunday (or the rest of it, when today is already the weekend).
export function weekend() {
  const dow = new Date(`${TODAY}T12:00:00Z`).getUTCDay(); // 0 Sun .. 6 Sat
  const fri = dow === 0 ? addDays(TODAY, -2) : addDays(TODAY, (5 - dow + 7) % 7);
  return { from: dow === 0 || dow === 6 ? TODAY : fri, to: dow === 0 ? TODAY : addDays(fri, 2) };
}
export const inRange = (i: Item, from: string, to: string) => i.facts.start! <= to && (i.facts.end || i.facts.start!) >= from;

export function cityStats() {
  const list = items();
  // Benton and Washington counties only (Sam, 2026-11-21); cities.json keeps every town for the sync.
  return getCities().filter((c) => /Benton|Washington/.test(c.county)).map((c) => {
    const mine = list.filter((i) => i.city === c.name);
    return { ...c, href: `/cities/${c.slug}/`, count: mine.length, upcoming: upcoming(mine).length, latest: mine[0] };
  });
}

export function topicStats() {
  const list = items();
  return TOPICS.map((t) => ({ ...t, count: list.filter((i) => i.category === t.name).length }));
}

export const itemsForPlace = (slug: string) => items().filter((i) => i.facts.place?.slug === slug);

// Places with two or more stories get their own page.
export function placeStats() {
  const list = items();
  return PLACES.map((p) => {
    const mine = list.filter((i) => i.facts.place?.slug === p.slug);
    return { ...p, match: undefined, href: `/places/${p.slug}/`, count: mine.length, upcoming: upcoming(mine).length };
  }).filter((p) => p.count >= 2);
}

// Up to n related stories: same place, then same city, then same topic. Upcoming events first.
export function related(a: Item, n = 3) {
  const others = items().filter((x) => x.slug !== a.slug);
  const score = (x: Item) =>
    (a.facts.place && x.facts.place?.slug === a.facts.place.slug ? 4 : 0) + (x.city === a.city ? 2 : 0) + (x.category === a.category ? 1 : 0) + (x.facts.upcoming ? 0.5 : 0);
  return others.map((x) => ({ x, s: score(x) })).filter((r) => r.s >= 1).sort((p, q) => q.s - p.s).slice(0, n).map((r) => r.x);
}

// The next older story, wrapping around to the newest.
export function nextStory(slug: string) {
  const list = items();
  const i = list.findIndex((x) => x.slug === slug);
  return list[(i + 1) % list.length];
}

export const cityHref = (name: string) => {
  const c = getCities().find((x) => x.name === name);
  return c ? `/cities/${c.slug}/` : undefined;
};
export const topicHref = (name: string) => topicByName(name)?.href;

// The search index: every story, place, city, topic and guide. Small enough to load whole.
export type SearchEntry = { t: string; u: string; k: 'story' | 'place' | 'city' | 'topic' | 'guide'; s?: string; m?: string; d?: string; img?: string };
export function searchEntries(): SearchEntry[] {
  const list = items();
  return [
    ...list.map((i) => ({
      t: i.title,
      u: i.href,
      k: 'story' as const,
      s: i.summary,
      m: [i.city, i.category, i.facts.place?.name, i.free ? 'Free' : '', i.facts.kind === 'opening' ? 'Opening new restaurant shop' : '', i.facts.kind === 'event' ? 'Event things to do' : ''].filter(Boolean).join(' · '),
      d: i.facts.start || i.date.slice(0, 10),
      img: i.image,
    })),
    ...placeStats().map((p) => ({ t: p.name, u: p.href, k: 'place' as const, s: p.blurb, m: `${p.city} · ${p.count} stories` })),
    ...cityStats().map((c) => ({ t: c.name, u: c.href, k: 'city' as const, s: c.intro, m: `${c.county} · ${c.count} stories` })),
    ...topicStats().filter((t) => t.count).map((t) => ({ t: t.h1, u: t.href, k: 'topic' as const, s: t.blurb, m: `${t.count} stories` })),
    ...getGuides().map((g) => ({ t: g.title, u: `/guides/${g.slug}/`, k: 'guide' as const, s: g.summary })),
    { t: 'Free things to do', u: '/guides/free-things-to-do/', k: 'guide' as const, s: 'Free outings and events we have covered.' },
    { t: 'Events calendar', u: '/calendar/', k: 'guide' as const, s: 'Every event by month. Subscribe in Apple, Google or Outlook.' },
  ];
}
