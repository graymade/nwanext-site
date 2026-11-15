// "Now" for the whole build. Set NWA_NOW (an ISO date) to preview the site as it looked on that day:
// stories dated after it are left out and "upcoming" is worked out from it. Unset, it is the real time.
const TZ = 'America/Chicago';
export const NOW = process.env.NWA_NOW ? new Date(process.env.NWA_NOW) : new Date();
export const IS_PREVIEW_DATE = !!process.env.NWA_NOW;

// Calendar day in Central time, as YYYY-MM-DD.
export const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });
export const TODAY = dayKey(NOW);

// Adds whole days to a YYYY-MM-DD key.
export function addDays(key: string, n: number) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
