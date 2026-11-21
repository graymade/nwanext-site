// The towns page map: a close, flat map of Benton and Washington counties in world coordinates
// (x = lon scaled for latitude, y = lat, 1000 units a degree). State lines are real: us-atlas states-10m (Census, public domain).
// Towns come from cities.json lat/lon. Beaver Lake is hand-placed (stylized). site.js sizes labels and markers in screen pixels,
// places labels so none collide, and drives the town card.
import TOPO_RAW from '../brand/us-states-10m.json';
import { getPhotos } from '../content';
import { CITIES, F0, blob, cityUrl, esc, smooth, type V } from './kit';

type Topo = { arcs: number[][][]; transform: { scale: number[]; translate: number[] }; objects: { states: { geometries: { type: string; arcs: number[][] | number[][][]; properties: { name: string } }[] } } };
const TOPO = TOPO_RAW as unknown as Topo;
const KX = Math.cos((36 * Math.PI) / 180);
const wp = ([lon, lat]: number[]) => [+((lon + 95) * KX * 1000).toFixed(1), +((37 - lat) * 1000).toFixed(1)] as [number, number];
const ARCS = TOPO.arcs.map((a) => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * TOPO.transform.scale[0] + TOPO.transform.translate[0], y * TOPO.transform.scale[1] + TOPO.transform.translate[1]]; }); });
const ringPts = (r: number[]) => r.flatMap((i, k) => { const a = i < 0 ? ARCS[~i].slice().reverse() : ARCS[i]; return k ? a.slice(1) : a; });
const stateD = (name: string) => {
  const g = TOPO.objects.states.geometries.find((x) => x.properties.name === name)!;
  const polys = (g.type === 'Polygon' ? [g.arcs] : g.arcs) as number[][][];
  return polys.map((poly) => poly.map((r) => 'M' + ringPts(r).map(wp).map((p) => p.join(' ')).join('L') + 'Z').join('')).join('');
};
const rectOf = (a: number[], b: number[]) => { const [x0, y0] = wp(a), [x1, y1] = wp(b); return [x0, y0, +(x1 - x0).toFixed(1), +(y1 - y0).toFixed(1)]; };
const VIEWS = { nwa: rectOf([-94.72, 36.57], [-93.86, 35.88]), core: rectOf([-94.62, 36.54], [-93.95, 35.9]) };
const TIER: Record<string, number> = { Bentonville: 1, Rogers: 1, Springdale: 1, Fayetteville: 1, Farmington: 1, 'Bella Vista': 2, 'Siloam Springs': 2, Centerton: 2, Lowell: 2, 'Pea Ridge': 2 };
const LAKE = [[-93.85, 36.425], [-93.9, 36.405], [-93.95, 36.375], [-94.0, 36.365], [-94.06, 36.35], [-94.01, 36.33], [-93.97, 36.3], [-94.0, 36.26], [-94.02, 36.235], [-93.975, 36.215], [-93.95, 36.17], [-93.93, 36.12]];

export type Counts = { ev: number; sp: number; nw: number };
export const townData = (counts: (name: string) => Counts) => CITIES().map((c) => {
  const ph = getPhotos().find((p) => p.city === c.name);
  return { n: c.name, s: c.slug, u: cityUrl(c.name), co: c.county, i: c.intro, ...counts(c.name), ph: ph ? { src: ph.src.replace(/\.[^.]+$/, '-800.webp'), alt: ph.caption } : null };
});

export function townMap(counts: (name: string) => Counts) {
  const cl = LAKE.map(wp), side = (sgn: number) => cl.map(([x, y], i) => { const [a, b] = [cl[Math.max(0, i - 1)], cl[Math.min(cl.length - 1, i + 1)]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, w = 5 + 11 * Math.sin((Math.PI * (i + 0.5)) / cl.length); return [x - (sgn * dy * w) / L, y + (sgn * dx * w) / L] as [number, number]; });
  const lake = smooth([...side(1), ...side(-1).reverse()]);
  const towns = CITIES().map((c) => ({ c, t: TIER[c.name] || 3, n: counts(c.name) })).sort((a, b) => b.t - a.t); // small ones first, so big ones draw on top
  return `<svg class="tsvg" viewBox="${VIEWS.nwa.join(' ')}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Map of Benton and Washington county towns" data-views='${JSON.stringify(VIEWS)}'>
<rect class="out" x="-3000" y="-3000" width="12000" height="12000"/>
${['Oklahoma', 'Missouri'].map((st) => `<path class="nb" d="${stateD(st)}"/>`).join('')}<path class="ar" d="${stateD('Arkansas')}"/><path class="lake" d="${lake}"/>
<text class="st" data-at="-94.2,36.535">Missouri</text><text class="st" data-at="-94.665,36.2" data-rot="-90">Oklahoma</text><text class="st lk" data-at="-93.935,36.262">Beaver Lake</text>
<path class="mfollow" d=""/>
${towns.map(({ c, t, n }) => { const [x, y] = wp([c.lon, c.lat]), all = n.ev + n.sp + n.nw;
  return `<a href="${cityUrl(c.name)}" class="mc t${t} ${all ? 'has' : ''}" data-town="${esc(c.name)}" data-x="${x}" data-y="${y}" aria-label="${esc(c.name)}${all ? `, ${all} ${all === 1 ? 'story' : 'stories'}` : ''}"><g class="mk" transform="translate(${x} ${y})"><path d="${smooth(blob(0, 0, 115, 85, 2.4, F0, (x % 7) * 0.4))}"/></g><text x="${x + 14}" y="${y + 8}">${esc(c.name)}</text></a>`; }).join('')}
</svg>`;
}
export const countsOf = (up: V[], openings: V[], news: V[]) => (name: string): Counts => ({ ev: up.filter((v) => v.city === name).length, sp: openings.filter((v) => v.city === name).length, nw: news.filter((v) => v.city === name).length });
