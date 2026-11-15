// Event dates, calendar links and directions. Client-safe (no fs), so client components can use it too.
import type { Facts } from './facts';

const TZ = 'America/Chicago';
const at = (key: string) => new Date(`${key}T12:00:00Z`);
const fmt = (key: string, opts: Intl.DateTimeFormatOptions) => at(key).toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });

// Parts for a date block: { weekday: "Fri", day: "25", month: "Sep" }.
export const dateParts = (key: string) => ({
  weekday: fmt(key, { weekday: 'short' }),
  day: fmt(key, { day: 'numeric' }),
  month: fmt(key, { month: 'short' }),
});

// "Friday, September 25"
export const dayHeading = (key: string) => fmt(key, { weekday: 'long', month: 'long', day: 'numeric' });

// "Sep 16–19", "Fri, Sep 25", "Sep 29"
export function eventDateLabel(f: Pick<Facts, 'start' | 'end'>, withWeekday = true) {
  if (!f.start) return '';
  if (f.end) {
    const sameMonth = f.start.slice(0, 7) === f.end.slice(0, 7);
    return `${fmt(f.start, { month: 'short', day: 'numeric' })}–${sameMonth ? fmt(f.end, { day: 'numeric' }) : fmt(f.end, { month: 'short', day: 'numeric' })}`;
  }
  return fmt(f.start, withWeekday ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' });
}

// "Tuesday, September 29, 7 PM"
export const whenLong = (f: Facts) => (f.start ? `${f.end ? eventDateLabel(f) : fmt(f.start, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${f.time ? `, ${f.time}` : ''}` : '');

const compact = (key: string, time?: string) => `${key.replace(/-/g, '')}${time ? `T${time.replace(':', '')}00` : ''}`;

// Google Calendar link. Without a time it is an all-day event.
export function googleCalendarUrl(title: string, f: Facts, details: string, location: string) {
  if (!f.start) return '';
  let dates: string;
  if (f.startTime) {
    const endTime = f.endTime || `${String(Math.min(23, Number(f.startTime.slice(0, 2)) + 2)).padStart(2, '0')}:${f.startTime.slice(3)}`;
    dates = `${compact(f.start, f.startTime)}/${compact(f.start, endTime)}`;
  } else {
    const endKey = new Date(at(f.end || f.start).getTime() + 86400000).toISOString().slice(0, 10);
    dates = `${compact(f.start)}/${compact(endKey)}`;
  }
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates, ctz: TZ, details, location });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

// Opens the place in the visitor's maps app or Google Maps.
export function directionsUrl(f: Facts, city: string) {
  const where = f.address ? `${f.address}, ${city}, AR` : f.place ? `${f.place.name}, ${f.place.city}, AR` : '';
  return where ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(where)}` : '';
}

// "Fermentation Hall at the Momentary, Bentonville" style line for lists.
export const whereLine = (f: Facts, city: string) => (f.place ? `${f.place.name}, ${f.place.city}` : city);
