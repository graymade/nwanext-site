// iCalendar output for one event and for the subscribable feeds. Server only.
import { absoluteUrl, getArticle, getSite } from './content';
import { items, type Item } from './data';
import { TODAY, addDays } from './now';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const day = (key: string) => key.replace(/-/g, '');
const nextDay = (key: string) => day(addDays(key, 1));
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

// Lines longer than 75 octets fold onto continuation lines that start with a space.
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; size = 0; }
    cur += ch;
    size += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:America/Chicago',
  'X-LIC-LOCATION:America/Chicago',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0600',
  'TZOFFSETTO:-0500',
  'TZNAME:CDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0600',
  'TZNAME:CST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

// One VEVENT. Timed events use local Chicago time; untimed ones are all-day (end date is exclusive).
export function vevent(i: Item) {
  const f = i.facts;
  if (f.kind !== 'event' || !f.start) return [];
  const a = getArticle(i.slug)!;
  const url = absoluteUrl(i.href);
  const where = [f.place?.name, f.address, `${f.place?.city || i.city}, AR`].filter(Boolean).join(', ');
  const endTime = f.endTime || (f.startTime ? `${String(Math.min(23, Number(f.startTime.slice(0, 2)) + 2)).padStart(2, '0')}:${f.startTime.slice(3)}` : '');
  const timed = !!f.startTime && !f.end;
  return [
    'BEGIN:VEVENT',
    `UID:${i.slug}@nwanext.com`,
    `DTSTAMP:${stamp(a.date)}`,
    timed ? `DTSTART;TZID=America/Chicago:${day(f.start)}T${f.startTime!.replace(':', '')}00` : `DTSTART;VALUE=DATE:${day(f.start)}`,
    timed ? `DTEND;TZID=America/Chicago:${day(f.start)}T${endTime.replace(':', '')}00` : `DTEND;VALUE=DATE:${nextDay(f.end || f.start)}`,
    `SUMMARY:${esc(i.title)}`,
    `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(`${i.summary}${f.end && f.time ? `\n\nDaily, ${f.time}.` : ''}\n\n${url}`)}`,
    `URL:${url}`,
    'END:VEVENT',
  ];
}

export function calendar({ name, events, feed }: { name: string; events: Item[]; feed: boolean }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NWA Next//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(feed
      ? [`X-WR-CALNAME:${esc(name)}`, 'X-WR-TIMEZONE:America/Chicago', `X-WR-CALDESC:${esc(`Things to do in Northwest Arkansas from ${getSite().name}.`)}`, 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H']
      : []),
    ...VTIMEZONE,
    ...events.flatMap(vevent),
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

// Every event still to come, plus the last 60 days, so a new subscriber sees recent ones too.
export function feedEvents(city?: string) {
  const since = addDays(TODAY, -60);
  return items().filter((i) => i.facts.kind === 'event' && i.facts.start && (i.facts.end || i.facts.start) >= since && (!city || i.city === city));
}

export const icsResponse = (body: string) => new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });

// Subscribe links for the feed at `path` (/calendar.ics or a city feed).
export function subscribeLinks(path: string, name = 'NWA Next') {
  const https = absoluteUrl(path);
  const webcal = https.replace(/^https?:\/\//, 'webcal://');
  return {
    https,
    apple: webcal,
    google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
    outlook: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent(name)}`,
  };
}
export type SubLinks = ReturnType<typeof subscribeLinks>;
