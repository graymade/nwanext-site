// Small helpers safe for server and client components (no fs).
const TZ = 'America/Chicago';
const yearOf = (d: Date) => Number(d.toLocaleDateString('en-US', { timeZone: TZ, year: 'numeric' }));

// "Sep 14", with the year added when it is not the current year.
export function shortDate(iso: string) {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { timeZone: TZ, month: 'short', day: 'numeric' };
  if (yearOf(d) !== yearOf(new Date())) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
}

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric' });

export const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: TZ, month: 'long', year: 'numeric' });

export const statusWord = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : '');
