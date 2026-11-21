// Key facts worked out from each story's own words: is it an event, when, where, what it costs.
// Captions are written to a pattern ("Saturday, Oct. 10, from 3-7:30 PM"), so this reads them at build time.
// A story's `event_date` in the CMS always wins over the guess.
import type { Article } from './content';
import { PLACES, type Place } from './taxonomy';
import { TODAY } from './now';

export type Kind = 'event' | 'opening' | 'coming' | 'news';
export type Facts = {
  kind: Kind;
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD, multi-day events only
  time?: string; // "3–9 PM", for display
  startTime?: string; // "15:00"
  endTime?: string; // "21:00"
  place?: { slug: string; name: string; city: string };
  address?: string;
  price?: string; // "Free", "$20"
  upcoming: boolean; // event that has not ended yet
};

const MONTH: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const DATE_RE =
  /\b(?:(?:mon|tues?|wed(?:nes)?|thu(?:rs)?|fri|sat(?:ur)?|sun)(?:day)?,?\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?(?:,?\s+(20\d\d))?\b/i;
const MER = '(a\\.?m\\.?|p\\.?m\\.?)';
const RANGE_RE = new RegExp(`\\b(\\d{1,2})(?::(\\d{2}))?\\s*${MER}?\\s*(?:-|–|to)\\s*(\\d{1,2})(?::(\\d{2}))?\\s*${MER}`, 'i');
const ONE_RE = new RegExp(`\\b(\\d{1,2})(?::(\\d{2}))?\\s*${MER}`, 'i');
const ADDRESS_RE =
  /\b\d{2,5}\s+(?:(?:N|S|E|W|NE|NW|SE|SW)\.?\s+)?(?:[A-Z0-9][A-Za-z0-9]*\.?\s+){0,3}(?:St|Street|Rd|Road|Dr|Drive|Blvd|Boulevard|Ave|Avenue|Ln|Lane|Pkwy|Parkway|Way)\b\.?(?:,?\s+Suite\s+\d+)?/;

// Events and arts stories with a date are events even if the CMS gave them a status ("opening its doors").
// News and outdoors stories need no status as well, so a road closing date does not count.
const EVENT_TOPICS = ['Events', 'Arts & Music'];
const MAYBE_EVENT_TOPICS = ['Outdoors', 'News'];
const COMING_RE = /\b(proposed|could be coming|coming soon|plans? to open|will open)\b/i;
const pad = (n: number) => String(n).padStart(2, '0');
const isPm = (m?: string) => !!m && m.toLowerCase().startsWith('p');

function to24(h: number, min: number, pm: boolean) {
  const hh = (h % 12) + (pm ? 12 : 0);
  return `${pad(hh)}:${pad(min)}`;
}
function clock(h: number, min: number) {
  return min ? `${h}:${pad(min)}` : `${h}`;
}

// "Doors at 6 PM" -> { time: "6 PM", startTime: "18:00" }. "3-9 PM" -> "3–9 PM".
function parseTime(text: string) {
  const r = text.match(RANGE_RE);
  if (r) {
    const [, h1, m1, mer1, h2, m2, mer2] = r;
    const a = Number(h1), b = Number(h2), am = Number(m1 || 0), bm = Number(m2 || 0);
    if (a <= 12 && b <= 12) {
      // "11-2 PM" starts in the morning; "3-9 PM" starts in the evening.
      const startPm = mer1 ? isPm(mer1) : isPm(mer2) && !(a > b && a !== 12);
      const endPm = isPm(mer2);
      const startLabel = mer1 && isPm(mer1) !== endPm ? `${clock(a, am)} ${startPm ? 'PM' : 'AM'}` : clock(a, am);
      return { time: `${startLabel}–${clock(b, bm)} ${endPm ? 'PM' : 'AM'}`, startTime: to24(a, am, startPm), endTime: to24(b, bm, endPm) };
    }
  }
  const o = text.match(ONE_RE);
  if (o) {
    const h = Number(o[1]), m = Number(o[2] || 0);
    if (h <= 12) return { time: `${clock(h, m)} ${isPm(o[3]) ? 'PM' : 'AM'}`, startTime: to24(h, m, isPm(o[3])) };
  }
  return {};
}

// The year is not always written. Assume the date falls within a few months after the post.
function inferYear(month: number, postIso: string, written?: string) {
  if (written) return Number(written);
  const post = new Date(postIso);
  const y = post.getUTCFullYear();
  return month < post.getUTCMonth() + 1 - 3 ? y + 1 : y;
}

function findDate(text: string, postIso: string) {
  const m = text.match(DATE_RE);
  if (!m || m.index === undefined) return undefined;
  const month = MONTH[m[1].slice(0, 3).toLowerCase()];
  const day = Number(m[2]);
  if (!month || day < 1 || day > 31) return undefined;
  const year = inferYear(month, postIso, m[4]);
  const start = `${year}-${pad(month)}-${pad(day)}`;
  const endDay = m[3] ? Number(m[3]) : undefined;
  const end = endDay && endDay > day ? `${year}-${pad(month)}-${pad(endDay)}` : undefined;
  return { start, end, after: text.slice(m.index + m[0].length, m.index + m[0].length + 360) };
}

// Plain text of the caption: links and handles become words.
const plainText = (md: string) => md.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_#>`]/g, '').replace(/\s+/g, ' ').trim();

export function placeFor(a: Article): Place | undefined {
  const hay = `${a.title} ${a.text}`;
  return PLACES.find((p) => p.match.some((re) => re.test(hay)));
}

export function factsFor(a: Article): Facts {
  const text = `${a.title}. ${plainText(a.text)}`;
  const place = placeFor(a);
  const address = text.match(ADDRESS_RE)?.[0].replace(/[.,]$/, '');
  const base = { place: place ? { slug: place.slug, name: place.name, city: place.city } : undefined, address };

  const guess = findDate(text.slice(0, 700), a.date);
  let found: { start: string; end?: string; after: string } | undefined;
  if (a.eventDate) {
    const start = a.eventDate.slice(0, 10);
    found = { start, end: guess?.start === start ? guess.end : undefined, after: guess?.after ?? text };
  } else if (EVENT_TOPICS.includes(a.category) || (MAYBE_EVENT_TOPICS.includes(a.category) && !a.status)) {
    found = guess;
  }

  if (found) {
    // The caption's own clock or calendar line ("🕒 Sat Nov 21, 3 to 4:30 PM") says the time best; then the text after the date.
    const line = (a.text.match(/^\s*[\u{1F550}-\u{1F567}\u{1F5D3}\u{1F4C5}\u{23F0}].*$/mu) || [])[0] || '';
    const fromLine = parseTime(line);
    const t = fromLine.time ? fromLine : parseTime(found.after);
    const price = a.free ? 'Free' : text.match(/\$\d+(?:\.\d{2})?(?!,\d)/)?.[0];
    const last = found.end || found.start;
    return { kind: 'event', start: found.start, end: found.end, ...t, price, upcoming: last >= TODAY, ...base };
  }
  if (COMING_RE.test(a.title) || (a.status === 'building' && a.category !== 'Development')) return { kind: 'coming', upcoming: false, ...base };
  if (a.status === 'opening') return { kind: 'opening', upcoming: false, ...base };
  return { kind: 'news', upcoming: false, ...base };
}
